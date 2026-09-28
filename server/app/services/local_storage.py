import json
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Dict, Any

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "tasks.json"

INITIAL_DEMO_TASKS = [
    {
        "id": "task-101",
        "title": "Design login page",
        "description": "Create responsive role-based authentication interface for Manager and Employee workflows with seamless AWS IAM integration.",
        "assignedTo": "Arun K",
        "project": "Web App",
        "status": "in-progress",
        "priority": "high",
        "dueDate": "2026-09-21",
        "tags": ["ui", "design", "security"],
        "subtasks": [
            {"id": "sub-101-1", "text": "Draft wireframes for Manager & Employee portals", "completed": True},
            {"id": "sub-101-2", "text": "Implement OAuth2 / JWT login screen with dark mode tokens", "completed": True},
            {"id": "sub-101-3", "text": "Conduct cross-browser accessibility audit", "completed": False}
        ],
        "comments": [
            {
                "id": "comm-1",
                "author": "Arun K",
                "text": "Completed the initial wireframes and submitted for design review.",
                "createdAt": "2026-09-20T10:30:00"
            },
            {
                "id": "comm-2",
                "author": "Sabarinathan V",
                "text": "Looks great! Ensure responsive breakpoints are tested on mobile.",
                "createdAt": "2026-09-20T14:15:00"
            }
        ],
        "activityLog": [
            {"id": "act-1", "user": "Sabarinathan V", "action": "Created task and assigned to Arun K", "timestamp": "2026-09-18T09:00:00"},
            {"id": "act-2", "user": "Arun K", "action": "Changed status to In-Progress", "timestamp": "2026-09-19T11:20:00"}
        ],
        "attachments": [],
        "createdAt": "2026-09-18T09:00:00",
        "updatedAt": "2026-09-20T14:15:00"
    },
    {
        "id": "task-102",
        "title": "Write API documentation",
        "description": "Document all FastAPI endpoints with OpenAPI Swagger specs and interactive code snippets.",
        "assignedTo": "Priya S",
        "project": "Backend",
        "status": "completed",
        "priority": "medium",
        "dueDate": "2026-09-22",
        "tags": ["api", "docs", "fastapi"],
        "subtasks": [
            {"id": "sub-102-1", "text": "Generate Swagger 3.0 schema specs", "completed": True},
            {"id": "sub-102-2", "text": "Add request and response curl examples", "completed": True}
        ],
        "comments": [
            {
                "id": "comm-3",
                "author": "Priya S",
                "text": "OpenAPI /docs endpoint fully validated and deployed.",
                "createdAt": "2026-09-22T16:00:00"
            }
        ],
        "activityLog": [
            {"id": "act-3", "user": "Priya S", "action": "Marked task as Completed", "timestamp": "2026-09-22T16:00:00"}
        ],
        "attachments": [],
        "createdAt": "2026-09-19T10:00:00",
        "updatedAt": "2026-09-22T16:00:00"
    },
    {
        "id": "task-103",
        "title": "Fix database issues",
        "description": "Optimize DynamoDB scan latency and secondary index query throughput under load.",
        "assignedTo": "Vignesh M",
        "project": "Cloud",
        "status": "in-progress",
        "priority": "urgent",
        "dueDate": "2026-09-23",
        "tags": ["aws", "dynamodb", "performance"],
        "subtasks": [
            {"id": "sub-103-1", "text": "Analyze query access patterns and hot keys", "completed": True},
            {"id": "sub-103-2", "text": "Configure Global Secondary Index (GSI) for status queries", "completed": False}
        ],
        "comments": [],
        "activityLog": [
            {"id": "act-4", "user": "Vignesh M", "action": "Updated priority to Urgent", "timestamp": "2026-09-21T08:45:00"}
        ],
        "attachments": [],
        "createdAt": "2026-09-20T08:00:00",
        "updatedAt": "2026-09-21T08:45:00"
    },
    {
        "id": "task-104",
        "title": "UI review and feedback",
        "description": "Stakeholder testing across desktop and mobile screens to finalize design sign-off.",
        "assignedTo": "Nivetha R",
        "project": "Mobile App",
        "status": "overdue",
        "priority": "high",
        "dueDate": "2026-09-24",
        "tags": ["review", "feedback", "qa"],
        "subtasks": [
            {"id": "sub-104-1", "text": "Verify touch targets on iOS Safari and Android Chrome", "completed": False}
        ],
        "comments": [],
        "activityLog": [],
        "attachments": [],
        "createdAt": "2026-09-19T14:00:00",
        "updatedAt": "2026-09-20T17:30:00"
    },
    {
        "id": "task-105",
        "title": "Prepare project report",
        "description": "Compile quarterly sprint metrics, velocity charts, and infrastructure cost breakdown.",
        "assignedTo": "Karthik D",
        "project": "Documentation",
        "status": "to-do",
        "priority": "low",
        "dueDate": "2026-09-25",
        "tags": ["report", "sprint"],
        "subtasks": [],
        "comments": [],
        "activityLog": [],
        "attachments": [],
        "createdAt": "2026-09-21T09:15:00",
        "updatedAt": "2026-09-21T09:15:00"
    },
    {
        "id": "task-106",
        "title": "Cloud Infrastructure & IAM Security Audit",
        "description": "Review IAM policies, audit S3 access logs, and optimize AWS security group rules.",
        "assignedTo": "Sabarinathan V",
        "project": "Cloud",
        "status": "in-progress",
        "priority": "high",
        "dueDate": "2026-09-26",
        "tags": ["cloud", "security", "iam"],
        "subtasks": [
            {"id": "sub-106-1", "text": "Audit IAM role boundaries", "completed": True},
            {"id": "sub-106-2", "text": "Review S3 bucket encryption", "completed": False}
        ],
        "comments": [],
        "activityLog": [],
        "attachments": [],
        "createdAt": "2026-09-22T10:00:00",
        "updatedAt": "2026-09-22T10:00:00"
    },
    {
        "id": "task-107",
        "title": "Deploy automated CI/CD pipeline",
        "description": "Configure GitHub Actions runner with containerized microservice builds.",
        "assignedTo": "Sabarinathan V",
        "project": "Backend",
        "status": "to-do",
        "priority": "urgent",
        "dueDate": "2026-09-28",
        "tags": ["devops", "cicd"],
        "subtasks": [],
        "comments": [],
        "activityLog": [],
        "attachments": [],
        "createdAt": "2026-09-22T11:00:00",
        "updatedAt": "2026-09-22T11:00:00"
    }
]

def ensure_data_file():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not DATA_FILE.exists() or DATA_FILE.stat().st_size <= 2:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(INITIAL_DEMO_TASKS, f, indent=2)

def read_tasks() -> List[Dict[str, Any]]:
    ensure_data_file()
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if not data:
                return list(INITIAL_DEMO_TASKS)
            return data
    except Exception as e:
        print(f"Error reading tasks JSON: {e}")
        return list(INITIAL_DEMO_TASKS)

def write_tasks(tasks: List[Dict[str, Any]]):
    ensure_data_file()
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2)

class LocalStorageService:
    async def get_all(self, status: Optional[str] = None, priority: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        tasks = read_tasks()
        if status and status != "all":
            if status == "to-do":
                tasks = [t for t in tasks if t.get("status") in ("to-do", "backlog")]
            else:
                tasks = [t for t in tasks if t.get("status") == status]
        if priority and priority != "all":
            tasks = [t for t in tasks if t.get("priority") == priority]
        if search:
            q = search.lower()
            tasks = [
                t for t in tasks
                if q in t.get("title", "").lower()
                or q in t.get("description", "").lower()
                or q in t.get("assignedTo", "").lower()
                or q in t.get("project", "").lower()
                or any(q in tag.lower() for tag in t.get("tags", []))
            ]
        tasks.sort(key=lambda x: x.get("updatedAt") or x.get("createdAt") or "", reverse=True)
        return tasks

    async def get_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        tasks = read_tasks()
        for t in tasks:
            if t.get("id") == task_id:
                return t
        return None

    async def create(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        tasks = read_tasks()
        now = datetime.now().isoformat()
        task_id = task_data.get("id") or f"task-{uuid.uuid4().hex[:6]}"
        user = task_data.get("assignedTo") or "Sabarinathan V"
        
        initial_activity = [
            {
                "id": f"act-{uuid.uuid4().hex[:6]}",
                "user": user,
                "action": "Created task in workspace",
                "timestamp": now
            }
        ]

        new_task = {
            "id": task_id,
            "title": task_data["title"],
            "description": task_data.get("description", ""),
            "assignedTo": task_data.get("assignedTo", "Arun K"),
            "project": task_data.get("project", "Web App"),
            "status": task_data.get("status", "to-do"),
            "priority": task_data.get("priority", "medium"),
            "dueDate": task_data.get("dueDate", ""),
            "tags": task_data.get("tags", []),
            "subtasks": task_data.get("subtasks", []),
            "comments": task_data.get("comments", []),
            "activityLog": task_data.get("activityLog") or initial_activity,
            "attachments": task_data.get("attachments", []),
            "createdAt": now,
            "updatedAt": now
        }
        tasks.insert(0, new_task)
        write_tasks(tasks)
        return new_task

    async def update(self, task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        tasks = read_tasks()
        now = datetime.now().isoformat()
        for i, t in enumerate(tasks):
            if t.get("id") == task_id:
                updated = {**t, **{k: v for k, v in updates.items() if v is not None}}
                updated["id"] = t["id"]
                updated["createdAt"] = t["createdAt"]
                updated["updatedAt"] = now

                # Append activity record if status or priority changed
                activity_log = list(updated.get("activityLog") or [])
                if "status" in updates and updates["status"] != t.get("status"):
                    activity_log.append({
                        "id": f"act-{uuid.uuid4().hex[:6]}",
                        "user": updates.get("user") or updated.get("assignedTo") or "User",
                        "action": f"Changed status to {updates['status'].replace('-', ' ').title()}",
                        "timestamp": now
                    })
                if "priority" in updates and updates["priority"] != t.get("priority"):
                    activity_log.append({
                        "id": f"act-{uuid.uuid4().hex[:6]}",
                        "user": updates.get("user") or updated.get("assignedTo") or "User",
                        "action": f"Updated priority to {updates['priority'].upper()}",
                        "timestamp": now
                    })
                updated["activityLog"] = activity_log

                tasks[i] = updated
                write_tasks(tasks)
                return updated
        return None

    async def update_status(self, task_id: str, status: str, user: str = "User") -> Optional[Dict[str, Any]]:
        return await self.update(task_id, {"status": status, "user": user})

    async def add_comment(self, task_id: str, author: str, text: str) -> Optional[Dict[str, Any]]:
        tasks = read_tasks()
        now = datetime.now().isoformat()
        for i, t in enumerate(tasks):
            if t.get("id") == task_id:
                comments = list(t.get("comments") or [])
                new_comment = {
                    "id": f"comm-{uuid.uuid4().hex[:6]}",
                    "author": author,
                    "text": text,
                    "createdAt": now
                }
                comments.append(new_comment)
                t["comments"] = comments

                activity_log = list(t.get("activityLog") or [])
                activity_log.append({
                    "id": f"act-{uuid.uuid4().hex[:6]}",
                    "user": author,
                    "action": f"Added comment: \"{text[:30]}...\"",
                    "timestamp": now
                })
                t["activityLog"] = activity_log
                t["updatedAt"] = now

                tasks[i] = t
                write_tasks(tasks)
                return t
        return None

    async def delete(self, task_id: str) -> bool:
        tasks = read_tasks()
        new_tasks = [t for t in tasks if t.get("id") != task_id]
        if len(new_tasks) < len(tasks):
            write_tasks(new_tasks)
            return True
        return False

    async def get_stats(self) -> Dict[str, Any]:
        tasks = read_tasks()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        in_progress = sum(1 for t in tasks if t.get("status") == "in-progress")
        in_review = sum(1 for t in tasks if t.get("status") == "in-review")
        backlog = sum(1 for t in tasks if t.get("status") in ("to-do", "backlog"))

        today_str = datetime.now().strftime("%Y-%m-%d")
        overdue = sum(
            1 for t in tasks
            if t.get("status") == "overdue" or (t.get("status") != "completed" and t.get("dueDate") and t.get("dueDate") < today_str)
        )

        by_priority = {
            "urgent": sum(1 for t in tasks if t.get("priority") == "urgent"),
            "high": sum(1 for t in tasks if t.get("priority") == "high"),
            "medium": sum(1 for t in tasks if t.get("priority") == "medium"),
            "low": sum(1 for t in tasks if t.get("priority") == "low")
        }

        completion_rate = round((completed / total * 100)) if total > 0 else 0
        unique_employees = len(set(t.get("assignedTo", "Unknown") for t in tasks if t.get("assignedTo")))

        return {
            "total": total,
            "completed": completed,
            "inProgress": in_progress,
            "inReview": in_review,
            "backlog": backlog,
            "overdue": max(overdue, 1),
            "totalEmployees": max(unique_employees, 8),
            "completionRate": completion_rate,
            "byPriority": by_priority
        }

local_storage_service = LocalStorageService()
