import json
import logging
from typing import Any

import google.generativeai as genai
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Routes LLM calls across three providers with automatic fallback.

    Default priority order (LLM_PREFER=auto):
        - Ollama healthy  -> ollama -> groq -> gemini
        - Ollama offline  -> groq   -> gemini

    LLM_PREFER options:
        - "auto"   : detect Ollama health, prefer local first
        - "local"  : ollama -> groq -> gemini
        - "cloud"  : groq   -> gemini -> ollama
        - "groq"   : groq   -> gemini -> ollama
        - "gemini" : gemini -> groq   -> ollama
        - "ollama" : ollama -> groq   -> gemini
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        if self.settings.gemini_api_key:
            genai.configure(api_key=self.settings.gemini_api_key)

    # ── Health check ──────────────────────────────────────────────────────

    async def _ollama_healthy(self) -> bool:
        """Return True if the local Ollama server is reachable."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.settings.ollama_base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    # ── Provider calls ────────────────────────────────────────────────────

    async def _call_ollama(self, prompt: str, system: str = "") -> str:
        """Call the local Ollama chat API and return the response text."""
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{self.settings.ollama_base_url}/api/chat",
                json={
                    "model": self.settings.ollama_model,
                    "messages": messages,
                    "stream": False,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

    async def _call_groq(self, prompt: str, system: str = "", json_mode: bool = False) -> str:
        """Call Groq cloud API (free tier: 14,400 req/day, latency < 1s)."""
        if not self.settings.groq_api_key:
            raise RuntimeError("GROQ_API_KEY is not configured")

        from groq import AsyncGroq  # lazy import – only when needed

        client = AsyncGroq(api_key=self.settings.groq_api_key)
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        kwargs: dict = {
            "messages": messages,  # type: ignore[arg-type]
            "model": self.settings.groq_model,
            "temperature": 0.7,
            "max_tokens": 1500,
        }
        if json_mode:
            # Force Groq to return pure JSON – eliminates markdown fence wrapping
            kwargs["response_format"] = {"type": "json_object"}

        completion = await client.chat.completions.create(**kwargs)
        return completion.choices[0].message.content or ""

    async def _call_gemini(self, prompt: str, system: str = "") -> str:
        """Call Google Gemini API (free tier: 15 req/min, 1M tokens/day)."""
        if not self.settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        model = genai.GenerativeModel(
            self.settings.gemini_model,
            system_instruction=system or None,
        )
        response = await model.generate_content_async(prompt)
        return response.text

    # ── Provider selection ────────────────────────────────────────────────

    def _has_groq(self) -> bool:
        return bool(self.settings.groq_api_key)

    def _has_gemini(self) -> bool:
        return bool(self.settings.gemini_api_key)

    async def _build_provider_list(self, prefer: str | None) -> list[str]:
        """Return ordered provider list based on LLM_PREFER setting."""
        mode = prefer or self.settings.llm_prefer

        if mode in ("local", "ollama"):
            return ["ollama", "groq", "gemini"]
        if mode == "cloud":
            return ["groq", "gemini", "ollama"]
        if mode == "groq":
            return ["groq", "gemini", "ollama"]
        if mode == "gemini":
            return ["gemini", "groq", "ollama"]

        # auto: prefer local if Ollama is available
        if await self._ollama_healthy():
            return ["ollama", "groq", "gemini"]
        return ["groq", "gemini", "ollama"]

    # ── Public API ────────────────────────────────────────────────────────

    async def generate(
        self,
        prompt: str,
        system: str = "",
        prefer: str | None = None,
        json_mode: bool = False,
    ) -> tuple[str, str]:
        """
        Generate text with automatic provider fallback.

        Returns:
            (result_text, provider_name)
        """
        providers = await self._build_provider_list(prefer)
        last_error: Exception | None = None

        for provider in providers:
            result: str | None = None
            try:
                if provider == "ollama":
                    if not await self._ollama_healthy():
                        logger.debug("Ollama unavailable, skipping.")
                        continue
                    logger.info("[LLMRouter] Using ollama (%s)", self.settings.ollama_model)
                    result = await self._call_ollama(prompt, system)

                elif provider == "groq":
                    if not self._has_groq():
                        logger.debug("Groq API key not set, skipping.")
                        continue
                    logger.info("[LLMRouter] Using groq (%s) json_mode=%s", self.settings.groq_model, json_mode)
                    result = await self._call_groq(prompt, system, json_mode=json_mode)

                elif provider == "gemini":
                    if not self._has_gemini():
                        logger.debug("Gemini API key not set, skipping.")
                        continue
                    logger.info("[LLMRouter] Using gemini (%s)", self.settings.gemini_model)
                    result = await self._call_gemini(prompt, system)

                if result is not None:
                    return result, provider

            except Exception as exc:
                last_error = exc
                logger.warning("[LLMRouter] Provider '%s' failed: %s", provider, exc)

        raise RuntimeError(
            f"All LLM providers failed. Last error: {last_error}. "
            "Check GROQ_API_KEY, GEMINI_API_KEY, or ensure Ollama is running."
        )

    async def generate_json(
        self,
        prompt: str,
        system: str = "",
        prefer: str | None = None,
    ) -> tuple[dict[str, Any], str]:
        """
        Generate and parse a JSON response.
        Uses json_mode=True for Groq to get clean JSON on the first try.
        Falls back to regex/clean + one retry on parse failure.

        Returns:
            (parsed_dict, provider_name)
        """
        raw, provider = await self.generate(prompt, system, prefer, json_mode=True)
        cleaned = self._clean_json_string(raw)

        try:
            return json.loads(cleaned), provider
        except json.JSONDecodeError:
            logger.warning("[LLMRouter] JSON parse failed (provider=%s), retrying with stricter prompt.", provider)
            retry_prompt = (
                f"{prompt}\n\n"
                "Return ONLY valid JSON. No markdown, no code fences, no extra text."
            )
            raw2, provider2 = await self.generate(retry_prompt, system, prefer, json_mode=True)
            cleaned2 = self._clean_json_string(raw2)
            return json.loads(cleaned2), provider2

    @staticmethod
    def _clean_json_string(raw: str) -> str:
        """Strip markdown code fences (```json ... ```) if present."""
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            # Remove opening fence line (e.g. ```json)
            cleaned = cleaned.split("\n", 1)[-1]
            # Remove closing fence
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
        return cleaned.strip()

    def provider_status(self) -> dict[str, Any]:
        """Return configuration status of all providers (for /llm-status endpoint)."""
        return {
            "ollama": {
                "configured": True,
                "base_url": self.settings.ollama_base_url,
                "model": self.settings.ollama_model,
            },
            "groq": {
                "configured": self._has_groq(),
                "model": self.settings.groq_model,
            },
            "gemini": {
                "configured": self._has_gemini(),
                "model": self.settings.gemini_model,
            },
            "prefer": self.settings.llm_prefer,
        }


llm_router = LLMRouter()
