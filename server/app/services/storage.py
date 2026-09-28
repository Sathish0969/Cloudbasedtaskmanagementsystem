import os
from typing import Dict, Any
from app.config import STORAGE_TYPE, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, DYNAMODB_TABLE_NAME
from app.services.local_storage import local_storage_service, LocalStorageService
from app.services.dynamodb_storage import dynamodb_storage_service, DynamoDBStorageService

def is_aws_configured() -> bool:
    """Check if AWS credentials or configuration are present."""
    return bool(
        (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) or
        os.getenv("AWS_CONTAINER_CREDENTIALS_RELATIVE_URI") or
        os.getenv("AWS_EXECUTION_ENV")
    )

def get_storage_service():
    """
    Returns the appropriate storage service based on configuration.
    Falls back gracefully to local storage if AWS is specified but not configured.
    """
    if STORAGE_TYPE in ("dynamodb", "aws"):
        if is_aws_configured():
            return dynamodb_storage_service
        else:
            print("[Storage] Warning: STORAGE_TYPE is set to DynamoDB, but AWS credentials not detected. Falling back to Local Storage.")
            return local_storage_service
    return local_storage_service

def get_storage_info() -> Dict[str, Any]:
    """
    Returns metadata about the active storage provider for health checks.
    """
    configured_type = STORAGE_TYPE
    aws_ready = is_aws_configured()
    
    if configured_type in ("dynamodb", "aws") and aws_ready:
        active_type = "dynamodb"
        mode = "cloud"
    else:
        active_type = "local"
        mode = "local"

    return {
        "activeType": active_type,
        "configuredType": configured_type,
        "mode": mode,
        "awsConfigured": aws_ready,
        "table": DYNAMODB_TABLE_NAME if active_type == "dynamodb" else "server/data/tasks.json"
    }
