from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class SubTask(BaseModel):
    id: str
    text: str
    completed: bool = False

class Attachment(BaseModel):
    id: str
    filename: str
    fileUrl: str
    fileSize: Optional[int] = None
    uploadedAt: Optional[str] = None

class Comment(BaseModel):
    id: str
    author: str
    text: str
    createdAt: str

class CommentCreate(BaseModel):
    author: Optional[str] = "Sabarinathan V"
    text: str = Field(..., min_length=1, max_length=1000)

class ActivityItem(BaseModel):
    id: str
    user: str
    action: str
    timestamp: str

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    status: str = Field("to-do", description="to-do, backlog, in-progress, in-review, completed, overdue")
    priority: str = Field("medium", description="low, medium, high, urgent")
    dueDate: Optional[str] = ""
    assignedTo: Optional[str] = "Arun K"
    project: Optional[str] = "Web App"
    tags: List[str] = Field(default_factory=list)
    subtasks: List[SubTask] = Field(default_factory=list)
    comments: List[Comment] = Field(default_factory=list)
    activityLog: List[ActivityItem] = Field(default_factory=list)
    completionRequested: Optional[bool] = False
    completionRequestedBy: Optional[str] = None
    completionRequestedAt: Optional[str] = None
    completionApprovedBy: Optional[str] = None
    completionApprovedAt: Optional[str] = None
    completionNotes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dueDate: Optional[str] = None
    assignedTo: Optional[str] = None
    project: Optional[str] = None
    tags: Optional[List[str]] = None
    subtasks: Optional[List[SubTask]] = None
    comments: Optional[List[Comment]] = None
    activityLog: Optional[List[ActivityItem]] = None
    completionRequested: Optional[bool] = None
    completionRequestedBy: Optional[str] = None
    completionRequestedAt: Optional[str] = None
    completionApprovedBy: Optional[str] = None
    completionApprovedAt: Optional[str] = None
    completionNotes: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: Optional[str] = "completed"
    user: Optional[str] = None
    notes: Optional[str] = None

class TaskOut(TaskBase):
    id: str
    attachments: List[Attachment] = Field(default_factory=list)
    createdAt: str
    updatedAt: str

class TaskStats(BaseModel):
    total: int
    completed: int
    inProgress: int
    inReview: int
    backlog: int
    overdue: int
    totalEmployees: Optional[int] = 8
    completionRate: int
    byPriority: Dict[str, int]
