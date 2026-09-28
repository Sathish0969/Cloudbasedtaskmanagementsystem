import os
from pathlib import Path
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import STORAGE_TYPE, AWS_REGION, DYNAMODB_TABLE_NAME, S3_BUCKET_NAME
from app.routes.tasks import router as tasks_router
from app.routes.attachments import router as attachments_router
from app.routes.teams import router as teams_router
from app.routes.websocket import router as ws_router
from app.services.websocket_manager import ws_manager
from app.services.storage import get_storage_info

app = FastAPI(
    title="Cloud Task Manager API",
    description="AWS DynamoDB & S3 enabled Task Manager backend with FastAPI & Real-Time WebSockets",
    version="1.2.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API & WebSocket routers
app.include_router(tasks_router, prefix="/api")
app.include_router(attachments_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(ws_router) # Mounts /ws/tasks

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "cloud-task-manager-api",
        "timestamp": datetime.now().isoformat(),
        "realtime": {
            "activeWebSocketClients": ws_manager.client_count,
            "status": "online"
        },
        "storage": {
            **get_storage_info(),
            "region": AWS_REGION,
            "dynamoDbTable": DYNAMODB_TABLE_NAME,
            "s3Bucket": S3_BUCKET_NAME
        }
    }

# Production Static SPA Serving
DIST_DIR = Path(__file__).resolve().parent.parent.parent / "client" / "dist"

if DIST_DIR.exists() and (DIST_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_target = DIST_DIR / full_path
        if file_target.exists() and file_target.is_file():
            return FileResponse(file_target)
        return FileResponse(DIST_DIR / "index.html")
