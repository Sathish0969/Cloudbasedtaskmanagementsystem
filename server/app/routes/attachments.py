from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Response
from pydantic import BaseModel
from app.services.s3_storage import s3_storage_service, UPLOAD_DIR

router = APIRouter(prefix="/attachments", tags=["Attachments"])

class PresignRequest(BaseModel):
    filename: str
    contentType: str = "application/octet-stream"

@router.post("/presign-upload")
async def generate_presign_upload(req: PresignRequest):
    return s3_storage_service.generate_presigned_upload_url(req.filename, req.contentType)

@router.put("/upload-local")
async def upload_local_file(key: str = Query(...), file: UploadFile = File(...)):
    # Local fallback for direct file saving
    dest = UPLOAD_DIR / key
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "wb") as f:
        content = await file.read()
        f.write(content)
    return {"status": "success", "fileUrl": f"/api/attachments/{key}"}

@router.get("/{full_path:path}")
async def get_attachment(full_path: str):
    file_path = UPLOAD_DIR / full_path
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Attachment file not found")
    with open(file_path, "rb") as f:
        content = f.read()
    return Response(content=content, media_type="application/octet-stream")
