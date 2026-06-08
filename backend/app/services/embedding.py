import logging
from typing import Any

from app.services.db_service import db_service

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as exc:
            logger.warning("Embedding model unavailable: %s", exc)
    return _model


def embed_text(text: str) -> list[float]:
    model = _get_model()
    if model is None:
        return [0.0] * 384
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def store_embedding(
    document_id: str,
    session_id: str | None,
    chunk_index: int,
    section_type: str,
    chunk_text: str,
) -> None:
    vector = embed_text(chunk_text)
    vector_str = "[" + ",".join(str(v) for v in vector) + "]"
    try:
        db_service.insert_embedding(
            document_id, session_id, chunk_index, section_type, chunk_text, vector_str
        )
    except Exception as exc:
        logger.warning("Failed to store embedding: %s", exc)


def build_chunks_from_profile(profile: dict[str, Any]) -> list[tuple[str, str]]:
    chunks: list[tuple[str, str]] = []
    for skill in profile.get("skills", []):
        name = skill if isinstance(skill, str) else skill.get("name", "")
        if name:
            chunks.append(("skill", f"Skill: {name}"))
    for exp in profile.get("experiences", []):
        text = f"{exp.get('role', '')} at {exp.get('company', '')}: {', '.join(exp.get('highlights', []))}"
        chunks.append(("experience", text))
    for proj in profile.get("projects", []):
        text = f"Project {proj.get('name', '')}: {proj.get('description', '')} Tech: {', '.join(proj.get('tech_stack', []))}"
        chunks.append(("project", text))
    for edu in profile.get("education", []):
        text = f"{edu.get('degree', '')} - {edu.get('school', '')}"
        chunks.append(("education", text))
    return chunks
