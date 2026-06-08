import asyncio
import logging

import edge_tts

logger = logging.getLogger(__name__)

VOICES = {
    "vi": "vi-VN-HoaiMyNeural",
    "en": "en-US-JennyNeural",
}

_cache: dict[str, bytes] = {}


async def synthesize_speech(text: str, language: str = "vi") -> bytes:
    # edge-tts ném NoAudioReceived neu text rong/chi co khoang trang
    if not text or not text.strip():
        return b""

    cache_key = f"{language}:{text[:200]}"
    if cache_key in _cache:
        return _cache[cache_key]

    voice = VOICES.get(language, VOICES["vi"])
    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_chunks: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])
    except Exception as exc:
        logger.warning("TTS failed: %s", exc)
        return b""

    audio = b"".join(audio_chunks)
    if audio:
        _cache[cache_key] = audio
    return audio


def synthesize_speech_sync(text: str, language: str = "vi") -> bytes:
    return asyncio.get_event_loop().run_until_complete(synthesize_speech(text, language))
