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
    ProfileUpdateResponse,
    RoleLoginValidateRequest,
    RoleLoginValidateResponse
)
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/teams", tags=["Teams"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
TEAMS_FILE = DATA_DIR / "teams.json"
USERS_FILE = DATA_DIR / "users.json"

DEFAULT_USERS_DATA = [
    {
        "id": "usr-mgr-101",
        "name": "Sabarinathan V",
        "email": "sabarinathan.mgr@taskflow.cloud",
        "role": "manager",
        "title": "Engineering Manager",
        "department": "Engineering Operations",
        "location": "San Francisco, CA (HQ)",
        "picture": None,
        "createdAt": "2026-09-18T09:00:00"
    },
    {
        "id": "usr-tl-103",
        "name": "Sabarinathan V",
        "email": "sabarinathan.tl@taskflow.cloud",
        "role": "teamleader",
        "title": "Team Leader (TL)",
        "department": "Sprint Architecture & Cloud Engineering",
        "location": "San Francisco, CA / Remote",
        "picture": None,
        "createdAt": "2026-09-18T09:00:00"
    },
    {
        "id": "usr-emp-102",
        "name": "Sabarinathan V",
        "email": "sabarinathan.emp@taskflow.cloud",
        "role": "employee",
        "title": "Senior Cloud Engineer",
        "department": "Cloud & Core Infrastructure",
        "location": "San Francisco, CA / Remote",
        "picture": None,
        "createdAt": "2026-09-18T09:00:00"
    }
]

def _read_users() -> List[Dict[str, Any]]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not USERS_FILE.exists() or USERS_FILE.stat().st_size <= 2:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(DEFAULT_USERS_DATA, f, indent=2)
        return list(DEFAULT_USERS_DATA)
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return list(DEFAULT_USERS_DATA)

def _write_users(users: List[Dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)

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

def _detect_user_role(email: str, teams: List[Dict[str, Any]], users: List[Dict[str, Any]]) -> tuple[Optional[str], Optional[Dict[str, Any]]]:
    clean_email = email.strip().lower()

    # 1. Check registered users list first
    for u in users:
        if (u.get("email") or "").strip().lower() == clean_email:
            u_role = (u.get("role") or "").lower()
            return u_role, u

    # 2. Check team leader in active team rosters
    for t in teams:
        tl_email = (t.get("teamLeaderEmail") or "").strip().lower()
        if tl_email == clean_email:
            return "teamleader", {
                "id": f"usr-tl-{t.get('id')}",
                "name": t.get("teamLeader", "Sabarinathan V"),
                "email": tl_email,
                "role": "teamleader",
                "title": "Team Leader (TL)",
                "department": "Sprint Architecture & Cloud Engineering",
                "teamId": t.get("id"),
                "teamName": t.get("name")
            }

    # 3. Check employees in active team squad rosters
    for t in teams:
        team_id = t.get("id", "")
        team_name = t.get("name", "Team")
        team_leader = t.get("teamLeader", "Team Leader")
        for m in t.get("members", []):
            m_email = (m.get("email") or "").strip().lower()
            if m_email == clean_email:
                return "employee", {
                    "id": m.get("id", ""),
                    "name": m.get("name", "Team Member"),
                    "email": m.get("email", ""),
                    "role": "employee",
                    "title": m.get("role", "Software Engineer"),
                    "avatar": m.get("avatar") or (m.get("name", "U")[0].upper() if m.get("name") else "U"),
                    "picture": m.get("picture"),
                    "phone": m.get("phone"),
                    "department": m.get("department") or "Engineering",
                    "location": m.get("location") or "Remote",
                    "bio": m.get("bio") or "",
                    "teamId": team_id,
                    "teamName": team_name,
                    "teamLeader": team_leader,
                    "joinedAt": m.get("joinedAt")
                }

    # 4. Pattern fallbacks for known naming conventions
    if ".mgr@" in clean_email or clean_email.startswith("manager@") or "sabarinathan.mgr" in clean_email:
        return "manager", {
            "id": "usr-mgr-gen",
            "name": clean_email.split("@")[0].replace(".", " ").title(),
            "email": clean_email,
            "role": "manager",
            "title": "Engineering Manager",
            "department": "Engineering Operations"
        }

    if ".tl@" in clean_email or clean_email.startswith("teamleader@") or "sabarinathan.tl" in clean_email:
        return "teamleader", {
            "id": "usr-tl-gen",
            "name": clean_email.split("@")[0].replace(".", " ").title(),
            "email": clean_email,
            "role": "teamleader",
            "title": "Team Leader (TL)",
            "department": "Sprint Architecture"
        }

    if ".emp@" in clean_email or clean_email.startswith("employee@"):
        return "employee", {
            "id": "usr-emp-gen",
            "name": clean_email.split("@")[0].replace(".", " ").title(),
            "email": clean_email,
            "role": "employee",
            "title": "Senior Cloud Engineer",
            "department": "Cloud Engineering"
        }

    return None, None

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

    users = _read_users()
    detected_role, _ = _detect_user_role(target_email, teams, users)
    if detected_role in ["manager", "teamleader"]:
        det_title = "Manager" if detected_role == "manager" else "Team Leader"
        return MemberVerifyResponse(
            authorized=False,
            member=None,
            message=f"Invalid email: '{verify_in.email}' is registered as a {det_title}. Only team members added by the Team Leader can login to the Employee portal. Please use the {det_title} portal."
        )

    return MemberVerifyResponse(
        authorized=False,
        member=None,
        message=f"Access Denied: The employee email '{verify_in.email}' is not registered in any team roster by the Team Leader. Only team members added by the Team Leader can login."
    )

@router.post("/validate-role-login", response_model=RoleLoginValidateResponse)
async def validate_role_login(req: RoleLoginValidateRequest):
    """
    Validates email for role-specific portal login (Manager, Team Leader, Employee).
    If Manager logs in with an Employee or Team Leader email -> returns invalid email error.
    If Team Leader logs in with a Manager or Employee email -> returns invalid email error.
    If Employee logs in with a Manager or Team Leader email -> returns invalid email error.
    """
    target_email = req.email.strip().lower()
    req_role = req.role.strip().lower()
    if req_role in ["tl", "team_leader"]:
        req_role = "teamleader"
    elif req_role in ["mgr"]:
        req_role = "manager"
    elif req_role in ["emp"]:
        req_role = "employee"

    teams = _read_teams()
    users = _read_users()
    detected_role, user_obj = _detect_user_role(target_email, teams, users)

    role_titles = {
        "manager": "Manager",
        "teamleader": "Team Leader",
        "employee": "Employee"
    }
    req_title = role_titles.get(req_role, req_role.capitalize())

    # Mismatch: Email registered as another role
    if detected_role and detected_role != req_role:
        det_title = role_titles.get(detected_role, detected_role.capitalize())
        return RoleLoginValidateResponse(
            authorized=False,
            role=detected_role,
            message=f"Invalid email: '{req.email}' is registered as a {det_title}. Only authorized {req_title}s can log in here. Please use the {det_title} portal to log in.",
            user=None
        )

    # Not recognized for requested role
    if not detected_role:
        if req_role == "manager":
            return RoleLoginValidateResponse(
                authorized=False,
                role="manager",
                message=f"Invalid email: No Manager account found with '{req.email}'. Only authorized Managers can log in.",
                user=None
            )
        elif req_role == "teamleader":
            return RoleLoginValidateResponse(
                authorized=False,
                role="teamleader",
                message=f"Invalid email: No Team Leader account found with '{req.email}'. Only assigned Team Leaders can log in.",
                user=None
            )
        else: # employee
            return RoleLoginValidateResponse(
                authorized=False,
                role="employee",
                message=f"Invalid email: '{req.email}' is not registered in any team squad roster. Only team members added by the Team Leader can log in.",
                user=None
            )

    # Success: Matches role!
    return RoleLoginValidateResponse(
        authorized=True,
        role=req_role,
        message=f"{req_title} authenticated successfully.",
        user=user_obj
    )

@router.post("/register-account", response_model=RoleLoginValidateResponse)
async def register_account(req: RoleLoginValidateRequest):
    """Registers a new account for a specific role and saves to persistent storage."""
    target_email = req.email.strip().lower()
    req_role = req.role.strip().lower()
    if req_role in ["tl", "team_leader"]:
        req_role = "teamleader"
    elif req_role in ["mgr"]:
        req_role = "manager"
    elif req_role in ["emp"]:
        req_role = "employee"

    teams = _read_teams()
    users = _read_users()
    detected_role, user_obj = _detect_user_role(target_email, teams, users)

    role_titles = {
        "manager": "Manager",
        "teamleader": "Team Leader",
        "employee": "Employee"
    }
    req_title = role_titles.get(req_role, req_role.capitalize())

    # Conflict: already exists as a different role
    if detected_role and detected_role != req_role:
        det_title = role_titles.get(detected_role, detected_role.capitalize())
        return RoleLoginValidateResponse(
            authorized=False,
            role=detected_role,
            message=f"Registration conflict: '{req.email}' is already registered as a {det_title}. Please log in via the {det_title} portal.",
            user=None
        )

    # Already registered under this role
    if user_obj and detected_role == req_role:
        return RoleLoginValidateResponse(
            authorized=True,
            role=req_role,
            message=f"Account already exists as {req_title}. You may proceed to log in.",
            user=user_obj
        )

    # Create new user
    user_name = target_email.split("@")[0].replace(".", " ").title()
    title = (
        "Engineering Manager" if req_role == "manager"
        else "Team Leader (TL)" if req_role == "teamleader"
        else "Software Engineer"
    )
    new_user = {
        "id": f"usr-{uuid.uuid4().hex[:8]}",
        "name": user_name,
        "email": target_email,
        "role": req_role,
        "title": title,
        "department": "Engineering Management" if req_role == "manager" else ("Sprint Architecture" if req_role == "teamleader" else "Cloud Engineering"),
        "location": "San Francisco, CA / Remote",
        "picture": None,
        "createdAt": datetime.now().isoformat()
    }
    users.append(new_user)
    _write_users(users)

    # If employee, also add to primary team if not in any team
    if req_role == "employee" and teams:
        teams[0].setdefault("members", []).append({
            "id": f"mem-{uuid.uuid4().hex[:6]}",
            "name": user_name,
            "email": target_email,
            "role": title,
            "avatar": user_name[0].upper(),
            "status": "active",
            "joinedAt": datetime.now().strftime("%Y-%m-%d")
        })
        _write_teams(teams)
        await ws_manager.broadcast("TEAM_UPDATED", teams[0])

    return RoleLoginValidateResponse(
        authorized=True,
        role=req_role,
        message=f"{req_title} account created and authorized successfully.",
        user=new_user
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
                    # Sync to users.json if matching user exists
                    target_email = (m.get("email") or "").strip().lower()
                    if target_email:
                        users = _read_users()
                        user_modified = False
                        for u in users:
                            if (u.get("email") or "").strip().lower() == target_email:
                                if member_update.name is not None and member_update.name.strip():
                                    u["name"] = member_update.name.strip()
                                if member_update.picture is not None:
                                    u["picture"] = member_update.picture
                                if member_update.phone is not None:
                                    u["phone"] = member_update.phone.strip()
                                if member_update.department is not None:
                                    u["department"] = member_update.department.strip()
                                if member_update.location is not None:
                                    u["location"] = member_update.location.strip()
                                if member_update.bio is not None:
                                    u["bio"] = member_update.bio.strip()
                                user_modified = True
                        if user_modified:
                            _write_users(users)
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
