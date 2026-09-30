from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Header, status
from app.models.task import (
    TaskCreate, 
    TaskUpdate, 
    TaskStatusUpdate, 
    TaskOut, 
    TaskStats, 
    CommentCreate, 
    Comment
)
from app.services.storage import get_storage_service
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskOut])
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status (to-do, backlog, in-progress, in-review, completed, overdue)"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high, urgent)"),
    search: Optional[str] = Query(None, description="Search in title, description, tags, or assignees")
):
    storage = get_storage_service()
    return await storage.get_all(status=status, priority=priority, search=search)

@router.get("/stats", response_model=TaskStats)
async def get_stats():
    storage = get_storage_service()
    return await storage.get_stats()

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: str):
    storage = get_storage_service()
    task = await storage.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="Role of the requesting user")
):
    # Enforce role-based access control: Only Team Leader (TL) can create or assign tasks
    if x_user_role:
        role_normalized = x_user_role.strip().lower()
        if role_normalized in ["manager", "employee"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Neither Manager nor Employee has permission to create tasks. Only Team Leader (TL) is authorized to assign and create tasks."
            )

    storage = get_storage_service()
    created = await storage.create(task_in.model_dump())
    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("TASK_CREATED", created)
    return created

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str, 
    task_in: TaskUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="Role of the requesting user")
):
    if x_user_role:
        role_normalized = x_user_role.strip().lower()
        if role_normalized == "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Managers have view-only access on tasks. Tasks can only be modified by the Team Leader (TL)."
            )

    storage = get_storage_service()
    updated = await storage.update(task_id, task_in.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("TASK_UPDATED", updated)
    return updated

@router.patch("/{task_id}/status", response_model=TaskOut)
async def update_task_status(
    task_id: str, 
    status_in: TaskStatusUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="Role of the requesting user"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name", description="Name of the requesting user")
):
    valid_statuses = ["to-do", "backlog", "in-progress", "in-review", "completed", "overdue"]
    if status_in.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_in.status}'. Valid statuses: {valid_statuses}"
        )
    storage = get_storage_service()
    user_name = status_in.user or x_user_name or "Sabarinathan V"
    role_normalized = (x_user_role or "").strip().lower()
    from datetime import datetime
    now = datetime.now().isoformat()

    # Rule: Manager only sees tasks and cannot alter status or approve completion.
    if role_normalized == "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Managers have view-only access on tasks and cannot approve task completion or alter status. Task completion is approved exclusively by the Team Leader."
        )

    # Rule: If an employee marks a task as completed, it must NOT directly complete.
    # It must go to Team Leader (TL) for confirmation and approval (status: in-review, completionRequested: True).
    if status_in.status.lower() == "completed" and role_normalized == "employee":
        updated = await storage.update(task_id, {
            "status": "in-review",
            "completionRequested": True,
            "completionRequestedBy": user_name,
            "completionRequestedAt": now,
            "completionNotes": status_in.notes or "Submitted by employee for TL completion approval",
            "user": user_name
        })
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        await ws_manager.broadcast("TASK_COMPLETION_REQUESTED", {
            "id": task_id,
            "requestedBy": user_name,
            "task": updated
        })
        await ws_manager.broadcast("TASK_STATUS_CHANGED", {
            "id": task_id,
            "status": "in-review",
            "updatedAt": updated.get("updatedAt"),
            "task": updated
        })
        return updated

    # If completed by TL, confirm and approve completion
    if status_in.status.lower() == "completed":
        updated = await storage.update(task_id, {
            "status": "completed",
            "completionRequested": False,
            "completionApprovedBy": user_name,
            "completionApprovedAt": now,
            "user": user_name
        })
    else:
        updated = await storage.update_status(task_id, status_in.status, user=user_name)

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("TASK_STATUS_CHANGED", {
        "id": task_id,
        "status": status_in.status,
        "updatedAt": updated.get("updatedAt"),
        "task": updated
    })
    return updated

@router.post("/{task_id}/request-completion", response_model=TaskOut)
async def request_task_completion(
    task_id: str,
    status_in: Optional[TaskStatusUpdate] = None,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    storage = get_storage_service()
    user_name = (status_in and status_in.user) or x_user_name or "Employee"
    notes = (status_in and status_in.notes) or "Requesting TL confirmation to mark completed"
    from datetime import datetime
    now = datetime.now().isoformat()

    updated = await storage.update(task_id, {
        "status": "in-review",
        "completionRequested": True,
        "completionRequestedBy": user_name,
        "completionRequestedAt": now,
        "completionNotes": notes,
        "user": user_name
    })
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await ws_manager.broadcast("TASK_COMPLETION_REQUESTED", {"id": task_id, "requestedBy": user_name, "task": updated})
    await ws_manager.broadcast("TASK_STATUS_CHANGED", {"id": task_id, "status": "in-review", "updatedAt": updated.get("updatedAt"), "task": updated})
    return updated

@router.post("/{task_id}/approve-completion", response_model=TaskOut)
async def approve_task_completion(
    task_id: str,
    user_name: Optional[str] = Query(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized != "teamleader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Team Leader (TL) has the authority to approve task completion. Managers have view-only access."
        )

    approver = user_name or x_user_name or "Sabarinathan V (TL)"
    storage = get_storage_service()
    from datetime import datetime
    now = datetime.now().isoformat()

    updated = await storage.update(task_id, {
        "status": "completed",
        "completionRequested": False,
        "completionApprovedBy": approver,
        "completionApprovedAt": now,
        "user": approver
    })
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await ws_manager.broadcast("TASK_COMPLETION_APPROVED", {"id": task_id, "approvedBy": approver, "task": updated})
    await ws_manager.broadcast("TASK_STATUS_CHANGED", {"id": task_id, "status": "completed", "updatedAt": updated.get("updatedAt"), "task": updated})
    return updated

@router.post("/{task_id}/reject-completion", response_model=TaskOut)
async def reject_task_completion(
    task_id: str,
    user_name: Optional[str] = Query(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized != "teamleader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only Team Leader (TL) has the authority to reject task completion. Managers have view-only access."
        )

    rejecter = user_name or x_user_name or "Sabarinathan V (TL)"
    storage = get_storage_service()

    updated = await storage.update(task_id, {
        "status": "in-progress",
        "completionRequested": False,
        "user": rejecter
    })
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    await ws_manager.broadcast("TASK_STATUS_CHANGED", {"id": task_id, "status": "in-progress", "updatedAt": updated.get("updatedAt"), "task": updated})
    return updated

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="Role of the requesting user")
):
    # Enforce role-based access control: Only Team Leader can delete tasks
    if x_user_role:
        role_normalized = x_user_role.strip().lower()
        if role_normalized in ["manager", "employee"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Managers and Employees cannot delete tasks. Only Team Leader (TL) has delete authority."
            )

    storage = get_storage_service()
    deleted = await storage.delete(task_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("TASK_DELETED", {"id": task_id})
    return None

@router.post("/{task_id}/comments", response_model=TaskOut)
async def add_task_comment(task_id: str, comment_in: CommentCreate):
    storage = get_storage_service()
    author = comment_in.author or "Sabarinathan V"
    if hasattr(storage, "add_comment"):
        updated = await storage.add_comment(task_id, author=author, text=comment_in.text)
    else:
        # Fallback via general update
        task = await storage.get_by_id(task_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        comments = list(task.get("comments") or [])
        import uuid, datetime
        comments.append({
            "id": f"comm-{uuid.uuid4().hex[:6]}",
            "author": author,
            "text": comment_in.text,
            "createdAt": datetime.datetime.now().isoformat()
        })
        updated = await storage.update(task_id, {"comments": comments})

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("COMMENT_ADDED", {
        "taskId": task_id,
        "task": updated
    })
    return updated
