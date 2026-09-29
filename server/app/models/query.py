from typing import Optional
from pydantic import BaseModel, Field

class QueryCreate(BaseModel):
    taskId: Optional[str] = None
    taskTitle: Optional[str] = None
    senderName: str = Field(..., min_length=1, max_length=120)
    senderEmail: str = Field(..., min_length=3, max_length=150)
    teamLeader: Optional[str] = "Sabarinathan V"
    teamName: Optional[str] = "Cloud & Core Infrastructure Squad"
    subject: str = Field(..., min_length=2, max_length=200)
    message: str = Field(..., min_length=5, max_length=3000)
    priority: Optional[str] = "medium" # low, medium, high, urgent
    category: Optional[str] = "Task Blocker" # Task Blocker, Technical Clarification, Deadline Request, Resource Request, General Question

class QueryResponse(BaseModel):
    response: str = Field(..., min_length=1, max_length=3000)
    respondedBy: Optional[str] = "Sabarinathan V"
    status: Optional[str] = "resolved" # answered, resolved, pending

class QueryOut(BaseModel):
    id: str
    taskId: Optional[str] = None
    taskTitle: Optional[str] = None
    senderName: str
    senderEmail: str
    teamLeader: Optional[str] = "Sabarinathan V"
    teamName: Optional[str] = "Cloud & Core Infrastructure Squad"
    subject: str
    message: str
    priority: str = "medium"
    category: str = "Task Blocker"
    status: str = "pending" # pending, answered, resolved
    response: Optional[str] = None
    respondedBy: Optional[str] = None
    respondedAt: Optional[str] = None
    createdAt: str
    updatedAt: str
