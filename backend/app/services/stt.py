import base64
import io
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_whisper_model = None


def _get_whisper():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel

            settings = get_settings()
            device = settings.whisper_device
            compute_type = "float16" if device == "cuda" else "int8"
            _whisper_model = WhisperModel(settings.whisper_model, device=device, compute_type=compute_type)
        except Exception as exc:
            logger.warning("Whisper unavailable: %s", exc)
    return _whisper_model



def transcribe_audio_base64(audio_b64: str, language: str):
    model = _get_whisper()
    if model is None:
        return ""
    try:
        
        # 1. XỬ LÝ KHẢ NĂNG 2: Loại bỏ tiền tố định dạng nếu Frontend gửi kèm sang
        if "," in audio_b64:
            audio_b64 = audio_b64.split(",")[1]

        # Giải mã chuỗi base64 thuần túy thành bytes dữ liệu
        audio_data = base64.b64decode(audio_b64)
        
        # 2. Tạo bộ nhớ đệm BytesIO
        buffer = io.BytesIO(audio_data)
        
        # BƯỚC QUAN TRỌNG: Đưa con trỏ file về vị trí xuất phát (0) để model có thể đọc từ đầu
        buffer.seek(0)

        # 3. Truyền luồng bộ nhớ đệm đã được reset con trỏ vào model
        segments, _ = model.transcribe(
            buffer,  
            language=language if language in ("vi", "en") else None
        )
        
        # Thu thập kết quả văn bản
        transcript = "".join([segment.text for segment in segments])
        return transcript

    except Exception as e:
        print(f"Lỗi nhận diện STT chi tiết: {e}")
        return ""
    
def transcribe_audio_bytes(audio_bytes: bytes, language: str = "vi") -> str:
    return transcribe_audio_base64(base64.b64encode(audio_bytes).decode(), language)
