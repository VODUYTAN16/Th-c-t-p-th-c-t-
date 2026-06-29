# Trigger reload
import asyncio
import io
import logging

import edge_tts
from gtts import gTTS

logger = logging.getLogger(__name__)

_cache: dict[str, bytes] = {}

async def synthesize_speech(text: str, language: str = "vi", voice: str = "vi-VN-HoaiMyNeural") -> bytes:
    if not text or not text.strip():
        return b""

    if language != "vi" and voice == "vi-VN-HoaiMyNeural":
        voice = "en-US-AriaNeural"

    cache_key = f"{language}:{voice}:{text[:200]}"
    if cache_key in _cache:
        return _cache[cache_key]

    try:
        communicate = edge_tts.Communicate(text, voice)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
                
        if audio_data:
            _cache[cache_key] = audio_data
            return audio_data
    except Exception as exc:
        logger.warning("Edge TTS failed: %s. Falling back to gTTS.", exc)
        
    # Fallback to gTTS if Edge TTS fails (e.g. 403 error)
    try:
        def _generate():
            tts = gTTS(text=text, lang=language)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            return fp.getvalue()

        audio = await asyncio.to_thread(_generate)
        if audio:
            _cache[cache_key] = audio
        return audio
    except Exception as exc2:
        logger.warning("gTTS fallback failed: %s", exc2)
        return b""

def synthesize_speech_sync(text: str, language: str = "vi", voice: str = "vi-VN-HoaiMyNeural") -> bytes:
    return asyncio.get_event_loop().run_until_complete(synthesize_speech(text, language, voice))
