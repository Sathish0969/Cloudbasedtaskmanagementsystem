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

def test_task_creation_role_permissions():
    task_payload = {
        "title": "Role Permission Test Task",
        "description": "Checking role permission rules",
        "status": "to-do",
        "priority": "medium",
        "assignedTo": "Arun K"
    }

    # 1. Manager must NOT be able to create tasks (403 Forbidden)
    res_mgr = client.post("/api/tasks", json=task_payload, headers={"X-User-Role": "manager"})
    assert res_mgr.status_code == 403
    assert "Access Denied" in res_mgr.json()["detail"]

    # 2. Employee must NOT be able to create tasks (403 Forbidden)
    res_emp = client.post("/api/tasks", json=task_payload, headers={"X-User-Role": "employee"})
    assert res_emp.status_code == 403
    assert "Access Denied" in res_emp.json()["detail"]

    # 3. Team Leader (TL) MUST be able to create and assign tasks (201 Created)
    res_tl = client.post("/api/tasks", json=task_payload, headers={"X-User-Role": "teamleader"})
    assert res_tl.status_code == 201
    created = res_tl.json()
    assert created["title"] == task_payload["title"]

    # Clean up created task
    client.delete(f"/api/tasks/{created['id']}")

def test_task_deletion_role_permissions():
    # 1. Team Leader creates a task to test deletion
    res_tl = client.post("/api/tasks", json={
        "title": "Deletion Test Task",
        "description": "Checking delete permissions",
        "status": "to-do",
        "priority": "low"
    }, headers={"X-User-Role": "teamleader"})
    assert res_tl.status_code == 201
    task_id = res_tl.json()["id"]

    # 2. Employee tries to delete the task -> 403 Forbidden
    res_emp_del = client.delete(f"/api/tasks/{task_id}", headers={"X-User-Role": "employee"})
    assert res_emp_del.status_code == 403
    assert "Access Denied" in res_emp_del.json()["detail"]

    # 3. Manager tries to delete the task -> 204 No Content
    res_mgr_del = client.delete(f"/api/tasks/{task_id}", headers={"X-User-Role": "manager"})
    assert res_mgr_del.status_code == 204

    # 4. Verify task is deleted
    res_verify = client.get(f"/api/tasks/{task_id}")
    assert res_verify.status_code == 404

def test_team_role_permissions():
    # 1. Anyone can list teams
    res_list = client.get("/api/teams")
    assert res_list.status_code == 200
    assert isinstance(res_list.json(), list)

    team_payload = {
        "name": "Platform Security Engineers",
        "description": "Zero-trust architecture and compliance squad."
    }

    # 2. Employee cannot create a team (403 Forbidden)
    res_emp_create = client.post("/api/teams", json=team_payload, headers={"X-User-Role": "employee"})
    assert res_emp_create.status_code == 403
    assert "Access Denied" in res_emp_create.json()["detail"]

    # 3. Manager cannot create a team (403 Forbidden - only TL authority)
    res_mgr_create = client.post("/api/teams", json=team_payload, headers={"X-User-Role": "manager"})
    assert res_mgr_create.status_code == 403

    # 4. Team Leader can create a team (201 Created)
    res_tl_create = client.post("/api/teams", json=team_payload, headers={"X-User-Role": "teamleader"})
    assert res_tl_create.status_code == 201
    created_team = res_tl_create.json()
    team_id = created_team["id"]
    assert created_team["name"] == team_payload["name"]

    # 5. Employee cannot edit team name (403 Forbidden)
    res_emp_edit = client.put(f"/api/teams/{team_id}", json={"name": "Altered Name"}, headers={"X-User-Role": "employee"})
    assert res_emp_edit.status_code == 403

    # 6. Team Leader can edit team name (200 OK)
    res_tl_edit = client.put(f"/api/teams/{team_id}", json={"name": "DevSecOps Alpha Squad"}, headers={"X-User-Role": "teamleader"})
    assert res_tl_edit.status_code == 200
    assert res_tl_edit.json()["name"] == "DevSecOps Alpha Squad"

    # 7. Employee cannot add member (403 Forbidden)
    member_payload = {"name": "Vikram S", "role": "Security Analyst"}
    res_emp_add = client.post(f"/api/teams/{team_id}/members", json=member_payload, headers={"X-User-Role": "employee"})
    assert res_emp_add.status_code == 403

    # 8. Team Leader can add member (200 OK)
    res_tl_add = client.post(f"/api/teams/{team_id}/members", json=member_payload, headers={"X-User-Role": "teamleader"})
    assert res_tl_add.status_code == 200
    assert any(m["name"] == "Vikram S" for m in res_tl_add.json()["members"])

    # 9. Employee cannot kick out / remove member (403 Forbidden)
    res_emp_kick = client.delete(f"/api/teams/{team_id}/members/Vikram S", headers={"X-User-Role": "employee"})
    assert res_emp_kick.status_code == 403

    # 10. Team Leader can kick out member (200 OK)
    res_tl_kick = client.delete(f"/api/teams/{team_id}/members/Vikram S", headers={"X-User-Role": "teamleader"})
    assert res_tl_kick.status_code == 200
    assert not any(m["name"] == "Vikram S" for m in res_tl_kick.json()["members"])

    # 11. Employee cannot delete team (403 Forbidden)
    res_emp_del_team = client.delete(f"/api/teams/{team_id}", headers={"X-User-Role": "employee"})
    assert res_emp_del_team.status_code == 403

    # 12. Team Leader can delete team (204 No Content)
    res_tl_del_team = client.delete(f"/api/teams/{team_id}", headers={"X-User-Role": "teamleader"})
    assert res_tl_del_team.status_code == 204

def test_task_completion_approval_workflow():
    # 1. Create a task as Team Leader
    create_res = client.post("/api/tasks", json={
        "title": "Approval Workflow Test Task",
        "description": "Requires employee completion and TL approval",
        "status": "in-progress",
        "priority": "high",
        "assignedTo": "Dev Employee"
    }, headers={"X-User-Role": "teamleader"})
    assert create_res.status_code == 201
    task = create_res.json()
    task_id = task["id"]
    assert task["completionRequested"] is False

    # 2. Employee marks task as "completed" via PATCH /api/tasks/{id}/status
    emp_complete_res = client.patch(
        f"/api/tasks/{task_id}/status",
        json={"status": "completed", "notes": "Completed sprint work, please verify"},
        headers={"X-User-Role": "employee", "X-User-Name": "Dev Employee"}
    )
    assert emp_complete_res.status_code == 200
    emp_task = emp_complete_res.json()
    # Must NOT directly become completed; should be routed to in-review with completionRequested = True
    assert emp_task["status"] == "in-review"
    assert emp_task["completionRequested"] is True
    assert emp_task["completionRequestedBy"] == "Dev Employee"

    # 3. Employee attempts to approve the completion -> 403 Forbidden
    emp_approve_res = client.post(
        f"/api/tasks/{task_id}/approve-completion",
        headers={"X-User-Role": "employee", "X-User-Name": "Dev Employee"}
    )
    assert emp_approve_res.status_code == 403
    assert "Team Leader or Manager approval required" in emp_approve_res.json()["detail"]

    # 4. Team Leader approves the completion -> 200 OK
    tl_approve_res = client.post(
        f"/api/tasks/{task_id}/approve-completion",
        headers={"X-User-Role": "teamleader", "X-User-Name": "Lead Architect"}
    )
    assert tl_approve_res.status_code == 200
    approved_task = tl_approve_res.json()
    assert approved_task["status"] == "completed"
    assert approved_task["completionRequested"] is False
    assert approved_task["completionApprovedBy"] == "Lead Architect"

    # 5. Test rejection workflow: Employee submits again via explicit request-completion
    # First set to in-progress
    client.patch(f"/api/tasks/{task_id}/status", json={"status": "in-progress"}, headers={"X-User-Role": "teamleader"})
    req_res = client.post(
        f"/api/tasks/{task_id}/request-completion",
        json={"notes": "Ready for second review"},
        headers={"X-User-Role": "employee", "X-User-Name": "Dev Employee"}
    )
    assert req_res.status_code == 200
    assert req_res.json()["completionRequested"] is True

    # Team Leader rejects completion -> returns to in-progress
    tl_reject_res = client.post(
        f"/api/tasks/{task_id}/reject-completion",
        json={"reason": "Need additional unit tests"},
        headers={"X-User-Role": "teamleader", "X-User-Name": "Lead Architect"}
    )
    assert tl_reject_res.status_code == 200
    rejected_task = tl_reject_res.json()
    assert rejected_task["status"] == "in-progress"
    assert rejected_task["completionRequested"] is False

    # Clean up
    client.delete(f"/api/tasks/{task_id}", headers={"X-User-Role": "teamleader"})




