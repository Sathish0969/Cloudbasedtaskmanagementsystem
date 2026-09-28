import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_websocket_realtime_connection():
    with client.websocket_connect("/ws/tasks") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "CONNECTION_ESTABLISHED"
        assert data["payload"]["status"] == "connected"
        
        # Test ping-pong keep-alive
        websocket.send_text("ping")
        response = websocket.receive_text()
        assert response == "pong"

def test_add_comment_to_task():
    # 1. Fetch existing tasks
    tasks = client.get("/api/tasks").json()
    assert len(tasks) > 0
    target_task = tasks[0]
    task_id = target_task["id"]

    # 2. Add comment
    comment_payload = {
        "author": "Antigravity Reviewer",
        "text": "Real-time task synchronization test comment."
    }
    response = client.post(f"/api/tasks/{task_id}/comments", json=comment_payload)
    assert response.status_code == 200
    updated_task = response.json()
    
    # 3. Verify comment added
    comments = updated_task.get("comments", [])
    assert len(comments) > 0
    assert any("Real-time task synchronization test comment." in c["text"] for c in comments)
