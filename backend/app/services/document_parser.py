import io
from pathlib import Path

from docx import Document as DocxDocument
from pypdf import PdfReader


def extract_text_from_bytes(content: bytes, filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        reader = PdfReader(io.BytesIO(content))
        parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
        return "\n".join(parts).strip()
    if ext in (".docx", ".doc"):
        doc = DocxDocument(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
    if ext == ".txt":
        return content.decode("utf-8", errors="ignore").strip()
    raise ValueError(f"Unsupported file type: {ext}")
