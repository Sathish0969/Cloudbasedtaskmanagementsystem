import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "cloud-task-manager-api"
    assert "storage" in data
    assert "activeType" in data["storage"]

def test_list_tasks():
    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert isinstance(tasks, list)
    assert len(tasks) > 0

def test_task_stats():
    response = client.get("/api/tasks/stats")
    assert response.status_code == 200
    stats = response.json()
    assert "total" in stats
    assert "completed" in stats
    assert "inProgress" in stats
    assert "completionRate" in stats
    assert "byPriority" in stats

def test_task_crud_lifecycle():
    # 1. Create a task
    payload = {
        "title": "Automated Test Task",
        "description": "Created during automated pytest test run",
        "status": "backlog",
        "priority": "high",
        "dueDate": "2026-10-01",
        "tags": ["testing", "qa", "pytest"],
        "subtasks": [
            {"id": "sub-1", "text": "Verify creation", "completed": False}
        ]
    }
    create_res = client.post("/api/tasks", json=payload)
    assert create_res.status_code == 201
    created_task = create_res.json()
    task_id = created_task["id"]
    assert created_task["title"] == payload["title"]
    assert created_task["status"] == "backlog"
    assert created_task["priority"] == "high"

    # 2. Get task by ID
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == task_id

    # 3. Update task status via PATCH
    status_res = client.patch(f"/api/tasks/{task_id}/status", json={"status": "in-progress"})
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "in-progress"

    # 4. Full update via PUT
    update_res = client.put(f"/api/tasks/{task_id}", json={
        "title": "Automated Test Task (Updated)",
        "priority": "urgent",
        "subtasks": [
            {"id": "sub-1", "text": "Verify creation", "completed": True}
        ]
    })
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Automated Test Task (Updated)"
    assert update_res.json()["priority"] == "urgent"
    assert update_res.json()["subtasks"][0]["completed"] is True

    # 5. Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 204

    # 6. Verify 404 after delete
    get_after_del = client.get(f"/api/tasks/{task_id}")
    assert get_after_del.status_code == 404

def test_attachment_presign_local_mode():
    res = client.post("/api/attachments/presign-upload", json={
        "filename": "architecture-diagram.png",
        "contentType": "image/png"
    })
    assert res.status_code == 200
    data = res.json()
    assert "uploadUrl" in data
    assert "fileUrl" in data
    assert "key" in data
    assert data["filename"] == "architecture-diagram.png"
