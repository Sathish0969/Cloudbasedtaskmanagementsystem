import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("taskmanager.websocket")
router = APIRouter(tags=["Realtime"])

@router.websocket("/ws/tasks")
async def task_realtime_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial confirmation handshake
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "payload": {
                "status": "connected",
                "message": "Real-time task synchronization active",
                "activeClients": ws_manager.client_count
            }
        })
        while True:
            # Keep connection alive & handle incoming pings or client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        ws_manager.disconnect(websocket)
