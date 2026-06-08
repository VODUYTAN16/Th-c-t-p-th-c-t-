import json
import logging
from typing import Any

import google.generativeai as genai
import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LLMRouter:
    def __init__(self) -> None:
        self.settings = get_settings()
        if self.settings.gemini_api_key:
            genai.configure(api_key=self.settings.gemini_api_key)

    async def _ollama_healthy(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.settings.ollama_base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def _call_ollama(self, prompt: str, system: str = "") -> str:
        messages = []
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
            data = resp.json()
            return data["message"]["content"]

    async def _call_gemini(self, prompt: str, system: str = "") -> str:
        if not self.settings.gemini_api_key:
            raise RuntimeError("Gemini API key not configured")
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system or None)
        response = await model.generate_content_async(prompt)
        return response.text

    async def generate(self, prompt: str, system: str = "", prefer: str | None = None) -> tuple[str, str]:
        mode = prefer or self.settings.llm_prefer
        providers: list[str]

        if mode == "local":
            providers = ["ollama", "gemini"]
        elif mode == "cloud":
            providers = ["gemini", "ollama"]
        else:
            providers = ["ollama", "gemini"] if await self._ollama_healthy() else ["gemini", "ollama"]

        last_error: Exception | None = None
        for provider in providers:
            try:
                if provider == "ollama":
                    if not await self._ollama_healthy():
                        continue
                    print("use ollama ##############################################################")
                    result = await self._call_ollama(prompt, system)
                else:
                    print("use gimini ##############################################################")
                    result = await self._call_gemini(prompt, system)
                logger.info("LLM response from %s", provider)
                return result, provider
            except Exception as exc:
                last_error = exc
                logger.warning("LLM provider %s failed: %s", provider, exc)

        raise RuntimeError(f"All LLM providers failed: {last_error}")

    async def generate_json(self, prompt: str, system: str = "") -> tuple[dict[str, Any], str]:
        raw, provider = await self.generate(prompt, system)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
        try:
            return json.loads(cleaned), provider
        except json.JSONDecodeError:
            retry_prompt = f"{prompt}\n\nRespond with valid JSON only, no markdown."
            raw2, provider2 = await self.generate(retry_prompt, system)
            cleaned2 = raw2.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            return json.loads(cleaned2), provider2


llm_router = LLMRouter()
