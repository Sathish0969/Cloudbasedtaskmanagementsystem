from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TeamMember(BaseModel):
    id: str
    name: str
    email: Optional[str] = ""
    role: Optional[str] = "Software Engineer"
    avatar: Optional[str] = "U"
    picture: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = "active"
    joinedAt: Optional[str] = None

class TeamMemberAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = ""
    role: Optional[str] = "Software Engineer"
    avatar: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None

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

class AuthorizedMemberOut(BaseModel):
    id: str
    name: str
    email: str
    role: Optional[str] = "Software Engineer"
    avatar: Optional[str] = "U"
    picture: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    teamId: str
    teamName: str
    teamLeader: Optional[str] = None
    joinedAt: Optional[str] = None

class MemberVerifyRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)

class MemberVerifyResponse(BaseModel):
    authorized: bool
    member: Optional[AuthorizedMemberOut] = None
    message: str

class RoleLoginValidateRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)
    role: str = Field(..., min_length=3, max_length=50)

class RoleLoginValidateResponse(BaseModel):
    authorized: bool
    role: str
    message: str
    user: Optional[Dict[str, Any]] = None

class ProfileUpdateRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)
    name: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

class ProfileUpdateResponse(BaseModel):
    success: bool
    message: str
    user: Dict[str, Any]


