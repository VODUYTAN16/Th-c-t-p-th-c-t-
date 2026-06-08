from typing import Any

from app.core.database import db
from app.core.llm_router import llm_router


async def decide_next_action(
    session_id: str,
    candidate_answer: str,
    language: str,
) -> dict[str, Any]:
    session = db.get_session(session_id)
    if not session:
        raise ValueError("Session not found")

    all_questions = db.list_questions(session_id)
    main_questions = [q for q in all_questions if not q.get("is_follow_up")]
    idx = session.get("current_question_index", 0)
    follow_up_count = session.get("follow_up_count", 0)

    if idx >= len(main_questions):
        return {"action": "complete", "message": "Cam on ban da hoan thanh phong van."}

    current_q = main_questions[idx]

    if follow_up_count < 2 and len(candidate_answer.strip()) > 10:
        prompt = f"""Ban la nha tuyen dung. Quyet dinh co can hoi follow-up khong.
Cau hoi hien tai: {current_q['question_text']}
Cau tra loi ung vien: {candidate_answer}
So follow-up da hoi: {follow_up_count}

Tra ve JSON: {{"action": "follow_up"|"next_question", "text": "cau hoi hoac phan hoi"}}
Ngon ngu: {language}
"""
        data, _ = await llm_router.generate_json(prompt, "Chi tra ve JSON hop le.")
        action = data.get("action", "next_question")
        text = data.get("text", "")

        if action == "follow_up" and text:
            db.update_session(session_id, {"follow_up_count": follow_up_count + 1})
            follow_up = db.create_question(
                {
                    "session_id": session_id,
                    "category": current_q["category"],
                    "question_text": text,
                    "order_index": current_q["order_index"],
                    "is_follow_up": True,
                    "parent_question_id": current_q["id"],
                }
            )
            return {"action": "follow_up", "text": text, "question_id": follow_up["id"]}

    next_idx = idx + 1
    db.update_session(session_id, {"current_question_index": next_idx, "follow_up_count": 0})

    if next_idx >= len(main_questions):
        return {"action": "complete", "message": "Cam on ban. Buoi phong van da ket thuc."}

    next_q = main_questions[next_idx]
    return {
        "action": "next_question",
        "text": next_q["question_text"],
        "question_id": next_q["id"],
        "question_index": next_idx,
        "total_questions": len(main_questions),
    }


async def get_opening_question(session_id: str) -> dict[str, Any]:
    session = db.get_session(session_id)
    if not session:
        raise ValueError("Session not found")

    main_questions = db.list_questions(session_id, main_only=True)
    if not main_questions:
        raise ValueError("No questions generated")

    first = main_questions[0]
    greeting = (
        "Xin chao, toi la nguoi phong van hom nay. Hay bat dau buoi phong van nhe."
        if session.get("language") == "vi"
        else "Hello, I will be your interviewer today. Let's begin."
    )

    return {
        "action": "question",
        "greeting": greeting,
        "text": first["question_text"],
        "question_id": first["id"],
        "question_index": 0,
        "total_questions": len(main_questions),
    }
