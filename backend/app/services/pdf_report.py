import io
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from fpdf import FPDF
from fpdf.enums import XPos, YPos

logger = logging.getLogger(__name__)

_FONTS_DIR = Path(__file__).parent / "fonts"
_FONT_REGULAR = _FONTS_DIR / "DejaVuSans.ttf"
_FONT_BOLD = _FONTS_DIR / "DejaVuSans-Bold.ttf"

# Ten font Unicode neu co file .ttf, nguoc lai fallback Helvetica (chi ASCII)
FONT_FAMILY = "DejaVu" if _FONT_REGULAR.exists() else "Helvetica"


def _register_unicode_font(pdf: FPDF) -> None:
    if FONT_FAMILY != "DejaVu":
        return
    pdf.add_font("DejaVu", "", str(_FONT_REGULAR))
    if _FONT_BOLD.exists():
        pdf.add_font("DejaVu", "B", str(_FONT_BOLD))
    else:
        # Khong co bold rieng -> dung regular cho ca style "B"
        pdf.add_font("DejaVu", "B", str(_FONT_REGULAR))


_MAX_WORD = 30  # do dai toi da 1 "tu" truoc khi chu dong chen khoang trang
_MAX_TEXT = 4000  # gioi han tong do dai 1 khoi text


def _break_long_words(text: str, limit: int = _MAX_WORD) -> str:
    """Chen khoang trang vao cac token qua dai (vd URL) de WORD-wrap hoat dong,
    tranh loi 'Not enough horizontal space' va treo khi dung wrapmode CHAR."""
    out: list[str] = []
    for word in text.split(" "):
        while len(word) > limit:
            out.append(word[:limit])
            word = word[limit:]
        out.append(word)
    return " ".join(out)


def _sanitize(text: Any) -> str:
    """Chuyen ve str, bo ky tu dieu khien, be token dai va gioi han do dai."""
    s = "" if text is None else str(text)
    s = "".join(ch for ch in s if ch == "\n" or ch >= " ")
    s = s[:_MAX_TEXT]
    # Xu ly tung dong de giu xuong dong, be tu dai trong moi dong
    return "\n".join(_break_long_words(line) for line in s.split("\n"))


def _mcell(pdf: FPDF, height: float, text: Any) -> None:
    """multi_cell an toan: token dai da duoc be san nen WORD-wrap luon co diem ngat."""
    content = _sanitize(text).strip()
    if not content:
        return
    # Ep con tro ve le trai sau moi block, neu khong multi_cell(0,...) ke tiep
    # se tinh chieu rong ~0 -> loi 'Not enough horizontal space'
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(0, height, content, new_x=XPos.LMARGIN, new_y=YPos.NEXT)


def generate_report_pdf(
    session_title: str,
    position: str,
    overall_score: float,
    averages: dict[str, float],
    summary: str,
    evaluations: list[dict[str, Any]],
    cv_suggestions: list[dict[str, Any]],
    reference_questions: list[dict[str, Any]] | None = None,
) -> bytes:
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    _register_unicode_font(pdf)
    pdf.add_page()

    pdf.set_font(FONT_FAMILY, "B", 16)
    _mcell(pdf, 10, "AI Interview Assistant - Bao cao phong van")
    pdf.set_font(FONT_FAMILY, "", 11)
    _mcell(pdf, 8, f"Vi tri: {position}")
    _mcell(pdf, 8, f"Tieu de: {session_title or 'N/A'}")
    _mcell(pdf, 8, f"Ngay: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    pdf.ln(5)

    pdf.set_font(FONT_FAMILY, "B", 13)
    _mcell(pdf, 8, f"Diem tong: {overall_score:.1f}/10")
    pdf.set_font(FONT_FAMILY, "", 10)
    for key, val in averages.items():
        _mcell(pdf, 6, f"  - {key}: {val:.1f}/10")
    pdf.ln(3)

    pdf.set_font(FONT_FAMILY, "B", 12)
    _mcell(pdf, 8, "Tong ket")
    pdf.set_font(FONT_FAMILY, "", 10)
    _mcell(pdf, 6, summary)
    pdf.ln(3)

    pdf.set_font(FONT_FAMILY, "B", 12)
    _mcell(pdf, 8, "Danh gia tung cau hoi")
    for i, ev in enumerate(evaluations, 1):
        pdf.set_font(FONT_FAMILY, "B", 10)
        q_text = _sanitize(ev.get("question_text", ""))[:120]
        _mcell(pdf, 6, f"{i}. {q_text}")
        pdf.set_font(FONT_FAMILY, "", 9)
        _mcell(pdf, 5, f"   Diem: {ev.get('score_overall', 0):.1f}/10")
        _mcell(pdf, 5, f"   Nhan xet: {_sanitize(ev.get('feedback', ''))[:300]}")
        pdf.ln(2)

    # Cau hoi chua phong van -> hien thi de tham khao, khong tinh diem.
    if reference_questions:
        pdf.ln(2)
        pdf.set_font(FONT_FAMILY, "B", 12)
        _mcell(pdf, 8, "Cau hoi tham khao (chua phong van - khong tinh diem)")
        for i, ref in enumerate(reference_questions, 1):
            pdf.set_font(FONT_FAMILY, "B", 10)
            q_text = _sanitize(ref.get("question_text", ""))[:120]
            _mcell(pdf, 6, f"{i}. {q_text}")
            sample = _sanitize(ref.get("sample_answer", "") or "")
            if sample:
                pdf.set_font(FONT_FAMILY, "", 9)
                _mcell(pdf, 5, f"   Cau tra loi mau: {sample[:400]}")
            pdf.ln(2)

    pdf.set_font(FONT_FAMILY, "B", 12)
    _mcell(pdf, 8, "Goi y cai thien CV")
    pdf.set_font(FONT_FAMILY, "", 10)
    for sug in cv_suggestions:
        section = _sanitize(sug.get("section", ""))
        suggestion = _sanitize(sug.get("suggestion", ""))
        _mcell(pdf, 6, f"- [{section}] {suggestion}")

    buf = io.BytesIO()
    pdf.output(buf)
    return buf.getvalue()
