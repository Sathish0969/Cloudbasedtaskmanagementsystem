import uvicorn
import os
import sys
from pathlib import Path

# Add server directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.config import PORT, HOST

if __name__ == "__main__":
    print(f"Starting Cloud Task Manager API server on http://{HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
