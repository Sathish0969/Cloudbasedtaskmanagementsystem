import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError
from app.config import DYNAMODB_TABLE_NAME, get_boto3_session_kwargs

class DynamoDBStorageService:
    def __init__(self):
        self._dynamodb = None
        self._table = None

    def _get_table(self):
        if self._table is None:
            kwargs = get_boto3_session_kwargs()
            self._dynamodb = boto3.resource("dynamodb", **kwargs)
            self._table = self._dynamodb.Table(DYNAMODB_TABLE_NAME)
        return self._table

    async def get_all(self, status: Optional[str] = None, priority: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        table = self._get_table()
        try:
            response = table.scan()
            tasks = response.get("Items", [])

            # Handle pagination if DynamoDB scan has more items
            while "LastEvaluatedKey" in response:
                response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
                tasks.extend(response.get("Items", []))

            if status and status != "all":
                tasks = [t for t in tasks if t.get("status") == status]
            if priority and priority != "all":
                tasks = [t for t in tasks if t.get("priority") == priority]
            if search:
                q = search.lower()
                tasks = [
                    t for t in tasks
                    if q in t.get("title", "").lower()
                    or q in t.get("description", "").lower()
                    or any(q in tag.lower() for tag in t.get("tags", []))
                ]

            tasks.sort(key=lambda x: x.get("updatedAt") or x.get("createdAt") or "", reverse=True)
            return tasks
        except ClientError as e:
            print(f"DynamoDB Scan Error: {e}")
            raise e

    async def get_by_id(self, task_id: str) -> Optional[Dict[str, Any]]:
        table = self._get_table()
        try:
            response = table.get_item(Key={"id": task_id})
            return response.get("Item")
        except ClientError as e:
            print(f"DynamoDB GetItem Error: {e}")
            raise e

    async def create(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        table = self._get_table()
        now = datetime.now().isoformat()
        new_task = {
            "id": task_data.get("id") or f"task-{uuid.uuid4().hex[:8]}",
            "title": task_data["title"],
            "description": task_data.get("description", ""),
            "status": task_data.get("status", "backlog"),
            "priority": task_data.get("priority", "medium"),
            "dueDate": task_data.get("dueDate", ""),
            "assignedTo": task_data.get("assignedTo", "Arun K"),
            "project": task_data.get("project", "Web App"),
            "tags": task_data.get("tags", []),
            "subtasks": task_data.get("subtasks", []),
            "attachments": task_data.get("attachments", []),
            "createdAt": now,
            "updatedAt": now
        }
        try:
            table.put_item(Item=new_task)
            return new_task
        except ClientError as e:
            print(f"DynamoDB PutItem Error: {e}")
            raise e

    async def update(self, task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        existing = await self.get_by_id(task_id)
        if not existing:
            return None

        updated = {**existing, **{k: v for k, v in updates.items() if v is not None}}
        updated["id"] = task_id
        updated["createdAt"] = existing.get("createdAt", datetime.now().isoformat())
        updated["updatedAt"] = datetime.now().isoformat()

        table = self._get_table()
        try:
            table.put_item(Item=updated)
            return updated
        except ClientError as e:
            print(f"DynamoDB Update Error: {e}")
            raise e

    async def update_status(self, task_id: str, status: str) -> Optional[Dict[str, Any]]:
        return await self.update(task_id, {"status": status})

    async def delete(self, task_id: str) -> bool:
        table = self._get_table()
        try:
            table.delete_item(Key={"id": task_id})
            return True
        except ClientError as e:
            print(f"DynamoDB DeleteItem Error: {e}")
            return False

    async def get_stats(self) -> Dict[str, Any]:
        tasks = await self.get_all()
        total = len(tasks)
        completed = sum(1 for t in tasks if t.get("status") == "completed")
        in_progress = sum(1 for t in tasks if t.get("status") == "in-progress")
        in_review = sum(1 for t in tasks if t.get("status") == "in-review")
        backlog = sum(1 for t in tasks if t.get("status") == "backlog")

        today_str = datetime.now().strftime("%Y-%m-%d")
        overdue = sum(
            1 for t in tasks
            if t.get("status") != "completed" and t.get("dueDate") and t.get("dueDate") < today_str
        )

        by_priority = {
            "urgent": sum(1 for t in tasks if t.get("priority") == "urgent"),
            "high": sum(1 for t in tasks if t.get("priority") == "high"),
            "medium": sum(1 for t in tasks if t.get("priority") == "medium"),
            "low": sum(1 for t in tasks if t.get("priority") == "low")
        }

        completion_rate = round((completed / total * 100)) if total > 0 else 0

        return {
            "total": total,
            "completed": completed,
            "inProgress": in_progress,
            "inReview": in_review,
            "backlog": backlog,
            "overdue": overdue,
            "completionRate": completion_rate,
            "byPriority": by_priority
        }

dynamodb_storage_service = DynamoDBStorageService()
