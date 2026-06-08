from pathlib import Path
from typing import Any

from app.agents.schemas import CandidateProfileData
from app.core.database import db
from app.core.llm_router import llm_router
from app.services.embedding import build_chunks_from_profile, store_embedding


def _load_prompt(name: str) -> str:
    path = Path(__file__).parent / "prompts" / name
    return path.read_text(encoding="utf-8")


async def parse_documents(
    session_id: str,
    cv_text: str,
    jd_text: str | None,
    position: str,
    industry: str | None,
) -> dict[str, Any]:
    system = _load_prompt("document_parser.txt")
    user_prompt = f"""CV:
{cv_text[:8000]}

JD:
{jd_text[:4000] if jd_text else "Khong co JD"}

Vi tri ung tuyen: {position}
Nganh: {industry or "Khong xac dinh"}
"""

    data, _ = await llm_router.generate_json(user_prompt, system)
    try:
        profile = CandidateProfileData.model_validate(data)
    except Exception:
        # JSON sai cau truc nang -> giu profile rong de pipeline khong sap;
        # cau hoi van tao duoc dua tren CV text / vi tri.
        profile = CandidateProfileData()

    session = db.get_session(session_id)
    if not session:
        raise ValueError("Session not found")

    profile_dict = profile.model_dump()
    db.upsert_candidate_profile(
        session_id,
        {
            "skills": profile_dict["skills"],
            "experiences": profile_dict["experiences"],
            "projects": profile_dict["projects"],
            "education": profile_dict["education"],
            "achievements": profile_dict["achievements"],
            "jd_gap_analysis": profile_dict["jd_gap_analysis"],
        },
    )

    chunks = build_chunks_from_profile(profile_dict)
    if jd_text:
        chunks.append(("jd", jd_text[:1000]))

    for idx, (section, text) in enumerate(chunks):
        store_embedding(session["cv_document_id"], session_id, idx, section, text)

    db.update_document(session["cv_document_id"], {"parse_status": "done", "raw_text": cv_text})
    if session.get("jd_document_id") and jd_text:
        db.update_document(session["jd_document_id"], {"parse_status": "done", "raw_text": jd_text})

    return profile_dict
