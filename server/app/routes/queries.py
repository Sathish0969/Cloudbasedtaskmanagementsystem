import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Header, status
from app.models.query import QueryCreate, QueryResponse, QueryOut
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/queries", tags=["Queries"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
QUERIES_FILE = DATA_DIR / "queries.json"

DEFAULT_QUERIES = [
  {
    "id": "qry-101",
    "taskId": "task-101",
    "taskTitle": "Design login page",
    "senderName": "Arun K",
    "senderEmail": "arun@taskflow.cloud",
    "teamLeader": "Sabarinathan V",
    "teamName": "Cloud & Core Infrastructure Squad",
    "subject": "Design token contrast check for Dark Mode theme",
    "message": "Hi TL, should we support secondary terracotta shades in the high-contrast dark theme mode, or stick strictly to neutral Slate tokens for accessibility compliance?",
    "priority": "medium",
    "category": "Technical Clarification",
    "status": "resolved",
    "response": "Use neutral Slate-900 tokens as the base container and keep terracotta only for primary active call-to-actions to guarantee AAA WCAG compliance.",
    "respondedBy": "Sabarinathan V (TL)",
    "respondedAt": "2026-09-20T14:30:00",
    "createdAt": "2026-09-20T11:00:00",
    "updatedAt": "2026-09-20T14:30:00"
  },
  {
    "id": "qry-102",
    "taskId": "task-103",
    "taskTitle": "Fix database issues",
    "senderName": "Vignesh M",
    "senderEmail": "vignesh@taskflow.cloud",
    "teamLeader": "Sabarinathan V",
    "teamName": "Cloud & Core Infrastructure Squad",
    "subject": "DynamoDB Global Secondary Index Provisioning",
    "message": "Need approval on enabling on-demand auto-scaling RCUs for the task status GSI to prevent throttling during sprint kickoff peaks.",
    "priority": "urgent",
    "category": "Task Blocker",
    "status": "pending",
    "response": None,
    "respondedBy": None,
    "respondedAt": None,
    "createdAt": "2026-09-21T09:15:00",
    "updatedAt": "2026-09-21T09:15:00"
  },
  {
    "id": "qry-103",
    "taskId": "task-104",
    "taskTitle": "UI review and feedback",
    "senderName": "Nivetha R",
    "senderEmail": "nivetha@taskflow.cloud",
    "teamLeader": "Sabarinathan V",
    "teamName": "UX & Quality Engineering",
    "subject": "Requesting 1 extra day for cross-browser testing on Safari & Firefox",
    "message": "Encountered minor flexbox baseline rendering discrepancies on older iOS Safari builds. Requesting deadline shift to Sep 25.",
    "priority": "high",
    "category": "Deadline Extension",
    "status": "pending",
    "response": None,
    "respondedBy": None,
    "respondedAt": None,
    "createdAt": "2026-09-21T10:00:00",
    "updatedAt": "2026-09-21T10:00:00"
  }
]

def _read_queries() -> List[Dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not QUERIES_FILE.exists() or QUERIES_FILE.stat().st_size <= 2:
        _write_queries(DEFAULT_QUERIES)
        return DEFAULT_QUERIES
    try:
        with open(QUERIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return DEFAULT_QUERIES

def _write_queries(queries: List[Dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(QUERIES_FILE, "w", encoding="utf-8") as f:
        json.dump(queries, f, indent=2)

@router.get("", response_model=List[QueryOut])
async def list_queries(
    sender_email: Optional[str] = Query(None, alias="senderEmail", description="Filter by sender employee email"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (pending, answered, resolved)"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    queries = _read_queries()
    filtered = queries

    if sender_email:
        target_email = sender_email.strip().lower()
        filtered = [q for q in filtered if (q.get("senderEmail") or "").strip().lower() == target_email]

    if status_filter and status_filter != "all":
        target_status = status_filter.strip().lower()
        filtered = [q for q in filtered if (q.get("status") or "").strip().lower() == target_status]

    if category and category != "all":
        target_cat = category.strip().lower()
        filtered = [q for q in filtered if (q.get("category") or "").strip().lower() == target_cat]

    return filtered

@router.get("/{query_id}", response_model=QueryOut)
async def get_query(query_id: str):
    queries = _read_queries()
    for q in queries:
        if q["id"] == query_id:
            return q
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found")

@router.post("", response_model=QueryOut, status_code=status.HTTP_201_CREATED)
async def create_query(
    query_in: QueryCreate,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    queries = _read_queries()
    new_id = f"qry-{uuid.uuid4().hex[:6]}"
    now = datetime.now().isoformat()

    new_query = {
        "id": new_id,
        "taskId": query_in.taskId,
        "taskTitle": query_in.taskTitle,
        "senderName": query_in.senderName or x_user_name or "Team Member",
        "senderEmail": query_in.senderEmail.strip().lower(),
        "teamLeader": query_in.teamLeader or "Sabarinathan V",
        "teamName": query_in.teamName or "Cloud & Core Infrastructure Squad",
        "subject": query_in.subject.strip(),
        "message": query_in.message.strip(),
        "priority": (query_in.priority or "medium").lower(),
        "category": query_in.category or "Task Blocker",
        "status": "pending",
        "response": None,
        "respondedBy": None,
        "respondedAt": None,
        "createdAt": now,
        "updatedAt": now
    }

    queries.insert(0, new_query)
    _write_queries(queries)

    await ws_manager.broadcast("QUERY_CREATED", new_query)
    return new_query

@router.patch("/{query_id}/respond", response_model=QueryOut)
async def respond_to_query(
    query_id: str,
    resp_in: QueryResponse,
    x_user_name: Optional[str] = Header(None, alias="X-User-Name"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    queries = _read_queries()
    now = datetime.now().isoformat()
    responder = resp_in.respondedBy or x_user_name or "Sabarinathan V (TL)"

    for q in queries:
        if q["id"] == query_id:
            q["response"] = resp_in.response.strip()
            q["respondedBy"] = responder
            q["respondedAt"] = now
            q["status"] = resp_in.status or "resolved"
            q["updatedAt"] = now
            _write_queries(queries)

            await ws_manager.broadcast("QUERY_UPDATED", q)
            return q

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found")

@router.delete("/{query_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_query(query_id: str):
    queries = _read_queries()
    new_queries = [q for q in queries if q["id"] != query_id]
    if len(new_queries) == len(queries):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query not found")
    _write_queries(new_queries)
    await ws_manager.broadcast("QUERY_DELETED", {"id": query_id})
    return None
