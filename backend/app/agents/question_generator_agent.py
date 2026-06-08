import json
from pathlib import Path
from typing import Any

from app.agents.schemas import QuestionList
from app.core.database import db
from app.core.llm_router import llm_router


def _load_prompt(name: str) -> str:
    path = Path(__file__).parent / "prompts" / name
    return path.read_text(encoding="utf-8")


async def generate_questions(
    session_id: str,
    profile: dict[str, Any],
    position: str,
    industry: str | None,
    language: str,
) -> list[dict[str, Any]]:
    template = _load_prompt("question_generator.txt")
    system = template.format(language=language, position=position, industry=industry or "")

    user_prompt = f"""Ho so ung vien:
{json.dumps(profile, ensure_ascii=False)[:6000]}
"""

    data, _ = await llm_router.generate_json(user_prompt, system)
    result = QuestionList.model_validate(data)

    db.delete_questions(session_id)

    created = []
    for q in result.questions:
        record = db.create_question(
            {
                "session_id": session_id,
                "category": q.category,
                "question_text": q.question_text,
                "order_index": q.order_index,
                "source_context": q.source_context or {},
            }
        )
        created.append(record)

    return created
