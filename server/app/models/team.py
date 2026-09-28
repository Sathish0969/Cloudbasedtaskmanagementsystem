from typing import List, Optional
from pydantic import BaseModel, Field

class TeamMember(BaseModel):
    id: str
    name: str
    email: Optional[str] = ""
    role: Optional[str] = "Software Engineer"
    avatar: Optional[str] = "U"
    status: Optional[str] = "active"
    joinedAt: Optional[str] = None

class TeamMemberAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = ""
    role: Optional[str] = "Software Engineer"
    avatar: Optional[str] = None

class TeamBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = ""
    teamLeader: Optional[str] = "Sabarinathan V"
    teamLeaderEmail: Optional[str] = "sabarinathan.tl@taskflow.cloud"

class TeamCreate(TeamBase):
    members: Optional[List[TeamMemberAdd]] = Field(default_factory=list)

class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = None
    teamLeader: Optional[str] = None

class TeamOut(TeamBase):
    id: str
    members: List[TeamMember] = Field(default_factory=list)
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
