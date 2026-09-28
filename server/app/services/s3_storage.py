import uuid
from pathlib import Path
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from app.config import S3_BUCKET_NAME, STORAGE_TYPE, get_boto3_session_kwargs

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

class S3StorageService:
    def __init__(self):
        self._s3_client = None

    def _get_client(self):
        if self._s3_client is None:
            kwargs = get_boto3_session_kwargs()
            self._s3_client = boto3.client("s3", **kwargs)
        return self._s3_client

    def generate_presigned_upload_url(self, filename: str, content_type: str = "application/octet-stream") -> Dict[str, Any]:
        file_ext = Path(filename).suffix
        key = f"attachments/{uuid.uuid4().hex[:12]}{file_ext}"

        if STORAGE_TYPE == "dynamodb" or STORAGE_TYPE == "aws":
            s3 = self._get_client()
            try:
                upload_url = s3.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": S3_BUCKET_NAME,
                        "Key": key,
                        "ContentType": content_type
                    },
                    ExpiresIn=900  # 15 minutes
                )
                file_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{key}"
                return {
                    "mode": "s3",
                    "uploadUrl": upload_url,
                    "fileUrl": file_url,
                    "key": key,
                    "filename": filename
                }
            except ClientError as e:
                print(f"Error generating S3 presigned URL: {e}")
                # Fall through to local simulation

        # Local mode: upload endpoint returns local API URL
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        return {
            "mode": "local",
            "uploadUrl": f"/api/attachments/upload-local?key={key}",
            "fileUrl": f"/api/attachments/{key}",
            "key": key,
            "filename": filename
        }

s3_storage_service = S3StorageService()
