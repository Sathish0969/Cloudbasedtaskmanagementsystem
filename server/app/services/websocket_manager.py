import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger("taskmanager.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, event_type: str, data: Any):
        """
        Broadcasts a typed event payload to all currently connected clients.
        Example events:
          - TASK_CREATED
          - TASK_UPDATED
          - TASK_STATUS_CHANGED
          - TASK_DELETED
          - COMMENT_ADDED
        """
        message = {
            "type": event_type,
            "payload": data
        }
        json_payload = json.dumps(message)
        
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json_payload)
            except Exception as e:
                logger.warning(f"Error broadcasting to client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

    @property
    def client_count(self) -> int:
        return len(self.active_connections)

ws_manager = ConnectionManager()
