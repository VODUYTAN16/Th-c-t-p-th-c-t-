from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.schemas import DocumentUploadResponse
from app.core.auth import get_current_user
from app.core.database import db
from app.services.supabase_storage import storage_service

router = APIRouter(prefix="/documents", tags=["documents"])

BUCKET_MAP = {"cv": "cvs", "jd": "job-descriptions"}
MIME_MAP = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".txt": "text/plain",
}


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    user: Annotated[dict, Depends(get_current_user)],
    file: UploadFile = File(...),
    doc_type: str = Form(...),
):
    if doc_type not in BUCKET_MAP:
        raise HTTPException(status_code=400, detail="doc_type must be 'cv' or 'jd'")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    user_id = user["sub"]
    doc_id = storage_service.new_doc_id()
    bucket = BUCKET_MAP[doc_type]
    path = storage_service.build_document_path(user_id, doc_id, file.filename or "file.pdf")

    ext = "." + (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else ".pdf"
    mime = file.content_type or MIME_MAP.get(ext, "application/octet-stream")

    storage_service.upload_file(bucket, path, content, mime)

    doc = db.create_document(
        {
            "id": doc_id,
            "user_id": user_id,
            "type": doc_type,
            "file_name": file.filename or "unknown",
            "mime_type": mime,
            "file_size_bytes": len(content),
            "storage_bucket": bucket,
            "storage_path": path,
        }
    )

    return DocumentUploadResponse(
        id=doc["id"],
        type=doc["type"],
        file_name=doc["file_name"],
        storage_path=doc["storage_path"],
    )
