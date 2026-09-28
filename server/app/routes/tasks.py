from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
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
async def create_task(task_in: TaskCreate):
    storage = get_storage_service()
    created = await storage.create(task_in.model_dump())
    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("TASK_CREATED", created)
    return created

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, task_in: TaskUpdate):
    storage = get_storage_service()
    updated = await storage.update(task_id, task_in.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    # Real-Time Broadcast to all connected clients
    await ws_manager.broadcast("TASK_UPDATED", updated)
    return updated

@router.patch("/{task_id}/status", response_model=TaskOut)
async def update_task_status(task_id: str, status_in: TaskStatusUpdate):
    valid_statuses = ["to-do", "backlog", "in-progress", "in-review", "completed", "overdue"]
    if status_in.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_in.status}'. Valid statuses: {valid_statuses}"
        )
    storage = get_storage_service()
    user_name = status_in.user or "Sabarinathan V"
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

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: str):
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
