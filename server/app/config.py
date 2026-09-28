import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root or server dir
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

load_dotenv(ROOT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")

PORT = int(os.getenv("PORT", "5000"))
HOST = os.getenv("HOST", "0.0.0.0")
STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local").lower()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_SESSION_TOKEN = os.getenv("AWS_SESSION_TOKEN")

DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "CloudTasks")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "cloud-task-manager-attachments")

def get_boto3_session_kwargs():
    kwargs = {"region_name": AWS_REGION}
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = AWS_SECRET_ACCESS_KEY
        if AWS_SESSION_TOKEN:
            kwargs["aws_session_token"] = AWS_SESSION_TOKEN
    return kwargs
