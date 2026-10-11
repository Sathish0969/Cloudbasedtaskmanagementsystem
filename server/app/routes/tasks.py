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

import re

def _is_task_assigned_to_user(task: dict, user_name: Optional[str], user_email: Optional[str]) -> bool:
    if not task:
        return False
    assigned = (task.get("assignedTo") or "").strip().lower()
    assigned_email = (task.get("assignedToEmail") or "").strip().lower()
    
    clean_user = (user_name or "").strip().lower()
    clean_email = (user_email or "").strip().lower()

    if clean_user:
        u_base = re.sub(r"\s*\(.*?\)\s*", "", clean_user).strip()
        a_base = re.sub(r"\s*\(.*?\)\s*", "", assigned).strip()
        if a_base and u_base and (a_base == u_base or a_base.startswith(u_base) or u_base.startswith(a_base)):
            return True

    if clean_email:
        if assigned == clean_email or assigned_email == clean_email:
            return True

    return False

@router.get("", response_model=List[TaskOut])
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status (to-do, backlog, in-progress, in-review, completed, overdue)"),
    priority: Optional[str] = Query(None, description="Filter by priority (low, medium, high, urgent)"),
    search: Optional[str] = Query(None, description="Search in title, description, tags, or assignees"),
    assigned_to: Optional[str] = Query(None, alias="assignedTo", description="Filter by assigned employee"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="Role of the requesting user"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name", description="Name of the requesting user"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email", description="Email of the requesting user")
):
    storage = get_storage_service()
    all_tasks = await storage.get_all(status=status, priority=priority, search=search)

    # Privacy Rule: An engineer must NEVER see other engineers' tasks!
    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized in ["employee", "frontend_engineer", "devops_engineer"]:
        user_name = x_user_name or assigned_to
        all_tasks = [t for t in all_tasks if _is_task_assigned_to_user(t, user_name, x_user_email)]
    elif assigned_to:
        all_tasks = [t for t in all_tasks if _is_task_assigned_to_user(t, assigned_to, None)]

    return all_tasks

@router.get("/stats", response_model=TaskStats)
async def get_stats(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    storage = get_storage_service()
    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized == "employee":
        # Calculate statistics strictly for this employee's assigned tasks
        from datetime import datetime
        all_tasks = await storage.get_all()
        emp_tasks = [t for t in all_tasks if _is_task_assigned_to_user(t, x_user_name, x_user_email)]
        total = len(emp_tasks)
        completed = sum(1 for t in emp_tasks if t.get("status") == "completed")
        in_progress = sum(1 for t in emp_tasks if t.get("status") == "in-progress")
        in_review = sum(1 for t in emp_tasks if t.get("status") == "in-review")
        backlog = sum(1 for t in emp_tasks if t.get("status") in ("to-do", "backlog"))
        
        today_str = datetime.now().strftime("%Y-%m-%d")
        overdue = sum(
            1 for t in emp_tasks
            if t.get("status") == "overdue" or (t.get("status") != "completed" and t.get("dueDate") and t.get("dueDate") < today_str)
        )
        by_priority = {
            "urgent": sum(1 for t in emp_tasks if t.get("priority") == "urgent"),
            "high": sum(1 for t in emp_tasks if t.get("priority") == "high"),
            "medium": sum(1 for t in emp_tasks if t.get("priority") == "medium"),
            "low": sum(1 for t in emp_tasks if t.get("priority") == "low")
        }
        completion_rate = round((completed / total * 100)) if total > 0 else 0
        return TaskStats(
            total=total,
            completed=completed,
            inProgress=in_progress,
            inReview=in_review,
            backlog=backlog,
            overdue=overdue,
            totalEmployees=1,
            completionRate=completion_rate,
            byPriority=by_priority
        )
    return await storage.get_stats()

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    storage = get_storage_service()
    task = await storage.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized == "employee":
        if not _is_task_assigned_to_user(task, x_user_name, x_user_email):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Employees can only view their own assigned tasks."
            )
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
    x_user_role: Optional[str] = Header(None, alias="X-User-Role", description="Role of the requesting user"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    if x_user_role:
        role_normalized = x_user_role.strip().lower()
        if role_normalized == "manager":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Managers have view-only access on tasks. Tasks can only be modified by the Team Leader (TL)."
            )
    storage = get_storage_service()
    existing = await storage.get_by_id(task_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized == "employee" and not _is_task_assigned_to_user(existing, x_user_name, x_user_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot modify tasks assigned to other employees."
        )

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
    x_user_name: Optional[str] = Header(None, alias="X-User-Name", description="Name of the requesting user"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email", description="Email of the requesting user")
):
    valid_statuses = ["to-do", "backlog", "in-progress", "in-review", "completed", "overdue"]
    if status_in.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_in.status}'. Valid statuses: {valid_statuses}"
        )
    storage = get_storage_service()
    existing = await storage.get_by_id(task_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    user_name = status_in.user or x_user_name or "Sabarinathan V"
    role_normalized = (x_user_role or "").strip().lower()

    if role_normalized == "employee" and not _is_task_assigned_to_user(existing, user_name, x_user_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You cannot change status of tasks assigned to other employees."
        )

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
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    storage = get_storage_service()
    existing = await storage.get_by_id(task_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    user_name = (status_in and status_in.user) or x_user_name or "Employee"
    notes = (status_in and status_in.notes) or "Requesting TL confirmation to mark completed"

    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized == "employee" and not _is_task_assigned_to_user(existing, user_name, x_user_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You can only request completion for tasks assigned to you."
        )

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
async def add_task_comment(
    task_id: str, 
    comment_in: CommentCreate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email")
):
    storage = get_storage_service()
    task = await storage.get_by_id(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    role_normalized = (x_user_role or "").strip().lower()
    if role_normalized == "employee" and not _is_task_assigned_to_user(task, x_user_name or comment_in.author, x_user_email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You can only comment on tasks assigned to you."
        )

    author = comment_in.author or x_user_name or "Sabarinathan V"
    if hasattr(storage, "add_comment"):
        updated = await storage.add_comment(task_id, author=author, text=comment_in.text)
    else:
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
