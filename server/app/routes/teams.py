import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, status
from app.models.team import (
    TeamCreate, 
    TeamUpdate, 
    TeamOut, 
    TeamMember, 
    TeamMemberAdd,
    TeamMemberUpdate,
    AuthorizedMemberOut,
    MemberVerifyRequest,
    MemberVerifyResponse,
    ProfileUpdateRequest,
    ProfileUpdateResponse
)
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/teams", tags=["Teams"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
TEAMS_FILE = DATA_DIR / "teams.json"

def _read_teams() -> List[Dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not TEAMS_FILE.exists() or TEAMS_FILE.stat().st_size <= 2:
        return []
    try:
        with open(TEAMS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _write_teams(teams: List[Dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(TEAMS_FILE, "w", encoding="utf-8") as f:
        json.dump(teams, f, indent=2)

def _require_teamleader(x_user_role: Optional[str], action: str = "modify teams"):
    role = (x_user_role or "").strip().lower()
    if role != "teamleader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Only Team Leader (TL) has the authority to {action}. Other roles have view-only access."
        )

@router.get("", response_model=List[TeamOut])
async def list_teams():
    return _read_teams()

@router.get("/members/authorized", response_model=List[AuthorizedMemberOut])
async def list_authorized_members():
    """Returns all authorized employee members stored by the Team Leader across all teams."""
    teams = _read_teams()
    authorized: List[Dict[str, Any]] = []
    seen_emails = set()

    for t in teams:
        team_id = t.get("id", "")
        team_name = t.get("name", "Team")
        team_leader = t.get("teamLeader", "Team Leader")
        for m in t.get("members", []):
            m_email = (m.get("email") or "").strip().lower()
            if m_email and m_email not in seen_emails:
                seen_emails.add(m_email)
                authorized.append({
                    "id": m.get("id", ""),
                    "name": m.get("name", ""),
                    "email": m.get("email", ""),
                    "role": m.get("role", "Software Engineer"),
                    "avatar": m.get("avatar") or (m.get("name", "U")[0].upper() if m.get("name") else "U"),
                    "picture": m.get("picture"),
                    "phone": m.get("phone"),
                    "department": m.get("department"),
                    "location": m.get("location"),
                    "bio": m.get("bio"),
                    "teamId": team_id,
                    "teamName": team_name,
                    "teamLeader": team_leader,
                    "joinedAt": m.get("joinedAt")
                })
    return authorized

@router.post("/verify-member", response_model=MemberVerifyResponse)
async def verify_team_member(verify_in: MemberVerifyRequest):
    """Verifies whether an employee email ID is registered in any team stored by the Team Leader."""
    target_email = verify_in.email.strip().lower()
    teams = _read_teams()

    for t in teams:
        team_id = t.get("id", "")
        team_name = t.get("name", "Team")
        team_leader = t.get("teamLeader", "Team Leader")
        for m in t.get("members", []):
            m_email = (m.get("email") or "").strip().lower()
            if m_email == target_email:
                member_out = AuthorizedMemberOut(
                    id=m.get("id", ""),
                    name=m.get("name", ""),
                    email=m.get("email", ""),
                    role=m.get("role", "Software Engineer"),
                    avatar=m.get("avatar") or (m.get("name", "U")[0].upper() if m.get("name") else "U"),
                    picture=m.get("picture"),
                    phone=m.get("phone"),
                    department=m.get("department"),
                    location=m.get("location"),
                    bio=m.get("bio"),
                    teamId=team_id,
                    teamName=team_name,
                    teamLeader=team_leader,
                    joinedAt=m.get("joinedAt")
                )
                return MemberVerifyResponse(
                    authorized=True,
                    member=member_out,
                    message=f"Verified team member in squad: {team_name}"
                )

    return MemberVerifyResponse(
        authorized=False,
        member=None,
        message=f"Access Denied: The employee email '{verify_in.email}' is not registered in any team roster by the Team Leader. Only team members added by the Team Leader can login."
    )

@router.put("/profile/update", response_model=ProfileUpdateResponse)
async def update_member_profile(profile_in: ProfileUpdateRequest):
    """Updates profile picture and contact details (phone, department, location, bio) for any member or leader."""
    target_email = profile_in.email.strip().lower()
    teams = _read_teams()
    updated_user = None
    modified = False

    for t in teams:
        for m in t.get("members", []):
            if (m.get("email") or "").strip().lower() == target_email:
                if profile_in.name is not None and profile_in.name.strip():
                    m["name"] = profile_in.name.strip()
                if profile_in.picture is not None:
                    m["picture"] = profile_in.picture
                if profile_in.phone is not None:
                    m["phone"] = profile_in.phone.strip()
                if profile_in.department is not None:
                    m["department"] = profile_in.department.strip()
                if profile_in.location is not None:
                    m["location"] = profile_in.location.strip()
                if profile_in.bio is not None:
                    m["bio"] = profile_in.bio.strip()
                if profile_in.avatar is not None:
                    m["avatar"] = profile_in.avatar
                modified = True
                updated_user = {
                    "id": m.get("id"),
                    "name": m.get("name"),
                    "email": m.get("email"),
                    "role": m.get("role"),
                    "avatar": m.get("avatar"),
                    "picture": m.get("picture"),
                    "phone": m.get("phone"),
                    "department": m.get("department"),
                    "location": m.get("location"),
                    "bio": m.get("bio"),
                    "teamId": t.get("id"),
                    "teamName": t.get("name"),
                    "teamLeader": t.get("teamLeader")
                }

    if modified:
        _write_teams(teams)
        await ws_manager.broadcast("TEAM_UPDATED", {"profileUpdated": True, "email": target_email})
        return ProfileUpdateResponse(
            success=True,
            message="Profile picture and contact details updated successfully.",
            user=updated_user
        )

    # Fallback for TL/Manager profile update
    fallback_user = {
        "email": profile_in.email,
        "name": profile_in.name or "User",
        "picture": profile_in.picture,
        "phone": profile_in.phone,
        "department": profile_in.department,
        "location": profile_in.location,
        "bio": profile_in.bio,
        "avatar": profile_in.avatar or (profile_in.name[0].upper() if profile_in.name else "U")
    }
    return ProfileUpdateResponse(
        success=True,
        message="Profile details updated successfully.",
        user=fallback_user
    )

@router.get("/{team_id}", response_model=TeamOut)
async def get_team(team_id: str):
    teams = _read_teams()
    for t in teams:
        if t["id"] == team_id:
            return t
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_in: TeamCreate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    _require_teamleader(x_user_role, "create new teams and name them")
    teams = _read_teams()

    new_id = f"team-{uuid.uuid4().hex[:6]}"
    now = datetime.now().isoformat()
    
    # Process initial members if provided
    members_list = []
    for m in team_in.members:
        clean_name = m.name.strip()
        members_list.append({
            "id": f"mem-{uuid.uuid4().hex[:6]}",
            "name": clean_name,
            "email": m.email or f"{clean_name.lower().replace(' ', '.')}@taskflow.cloud",
            "role": m.role or "Software Engineer",
            "avatar": m.avatar or (clean_name[0].upper() if clean_name else "U"),
            "picture": m.picture,
            "phone": m.phone,
            "department": m.department,
            "location": m.location,
            "bio": m.bio,
            "status": "active",
            "joinedAt": now[:10]
        })

    new_team = {
        "id": new_id,
        "name": team_in.name,
        "description": team_in.description or "",
        "teamLeader": team_in.teamLeader or "Sabarinathan V",
        "teamLeaderEmail": team_in.teamLeaderEmail or "sabarinathan.tl@taskflow.cloud",
        "members": members_list,
        "createdAt": now,
        "updatedAt": now
    }
    teams.append(new_team)
    _write_teams(teams)

    await ws_manager.broadcast("TEAM_CREATED", new_team)
    return new_team

@router.put("/{team_id}", response_model=TeamOut)
async def update_team(
    team_id: str,
    team_in: TeamUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    _require_teamleader(x_user_role, "edit team details or change the team name")
    teams = _read_teams()
    for t in teams:
        if t["id"] == team_id:
            if team_in.name is not None:
                t["name"] = team_in.name
            if team_in.description is not None:
                t["description"] = team_in.description
            if team_in.teamLeader is not None:
                t["teamLeader"] = team_in.teamLeader
            t["updatedAt"] = datetime.now().isoformat()
            _write_teams(teams)
            await ws_manager.broadcast("TEAM_UPDATED", t)
            return t
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

@router.post("/{team_id}/members", response_model=TeamOut)
async def add_team_member(
    team_id: str,
    member_in: TeamMemberAdd,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    _require_teamleader(x_user_role, "add members to the team")
    teams = _read_teams()
    for t in teams:
        if t["id"] == team_id:
            # Check if member already in team by name or email
            req_email = (member_in.email or "").strip().lower()
            for existing in t.get("members", []):
                if existing["name"].lower() == member_in.name.strip().lower():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Member '{member_in.name}' is already in this team."
                    )
                if req_email and (existing.get("email") or "").strip().lower() == req_email:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"An employee with email '{member_in.email}' is already in this team."
                    )
            
            clean_name = member_in.name.strip()
            clean_email = req_email if req_email else f"{clean_name.lower().replace(' ', '.')}@taskflow.cloud"
            avatar_char = member_in.avatar or (clean_name[0].upper() if clean_name else "U")

            new_member = {
                "id": f"mem-{uuid.uuid4().hex[:6]}",
                "name": clean_name,
                "email": clean_email,
                "role": member_in.role or "Software Engineer",
                "avatar": avatar_char,
                "picture": member_in.picture,
                "phone": member_in.phone,
                "department": member_in.department,
                "location": member_in.location,
                "bio": member_in.bio,
                "status": "active",
                "joinedAt": datetime.now().strftime("%Y-%m-%d")
            }
            t.setdefault("members", []).append(new_member)
            t["updatedAt"] = datetime.now().isoformat()
            _write_teams(teams)
            await ws_manager.broadcast("TEAM_UPDATED", t)
            return t
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

@router.put("/{team_id}/members/{member_id_or_name}", response_model=TeamOut)
async def update_team_member(
    team_id: str,
    member_id_or_name: str,
    member_update: TeamMemberUpdate,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    """Updates a team member's profile picture, contact details, role, department, location, or bio."""
    teams = _read_teams()
    for t in teams:
        if t["id"] == team_id:
            target = member_id_or_name.lower().strip()
            found = False
            for m in t.get("members", []):
                if m.get("id", "").lower() == target or m.get("name", "").lower() == target:
                    found = True
                    if member_update.name is not None and member_update.name.strip():
                        m["name"] = member_update.name.strip()
                    if member_update.email is not None and member_update.email.strip():
                        m["email"] = member_update.email.strip()
                    if member_update.role is not None:
                        m["role"] = member_update.role.strip()
                    if member_update.avatar is not None:
                        m["avatar"] = member_update.avatar
                    if member_update.picture is not None:
                        m["picture"] = member_update.picture
                    if member_update.phone is not None:
                        m["phone"] = member_update.phone.strip()
                    if member_update.department is not None:
                        m["department"] = member_update.department.strip()
                    if member_update.location is not None:
                        m["location"] = member_update.location.strip()
                    if member_update.bio is not None:
                        m["bio"] = member_update.bio.strip()
                    if member_update.status is not None:
                        m["status"] = member_update.status
                    break
            if not found:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in team")
            
            t["updatedAt"] = datetime.now().isoformat()
            _write_teams(teams)
            await ws_manager.broadcast("TEAM_UPDATED", t)
            return t
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

@router.delete("/{team_id}/members/{member_id_or_name}", response_model=TeamOut)
async def remove_team_member(
    team_id: str,
    member_id_or_name: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    _require_teamleader(x_user_role, "kick out or remove members from the team")
    teams = _read_teams()
    for t in teams:
        if t["id"] == team_id:
            orig_len = len(t.get("members", []))
            target = member_id_or_name.lower()
            t["members"] = [
                m for m in t.get("members", [])
                if m.get("id", "").lower() != target and m.get("name", "").lower() != target
            ]
            if len(t["members"]) == orig_len:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in team")
            
            t["updatedAt"] = datetime.now().isoformat()
            _write_teams(teams)
            await ws_manager.broadcast("TEAM_UPDATED", t)
            return t
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: str,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
):
    _require_teamleader(x_user_role, "delete teams")
    teams = _read_teams()
    new_teams = [t for t in teams if t["id"] != team_id]
    if len(new_teams) == len(teams):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    _write_teams(new_teams)
    await ws_manager.broadcast("TEAM_DELETED", {"id": team_id})
    return None
