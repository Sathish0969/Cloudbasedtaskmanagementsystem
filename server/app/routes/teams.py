import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Header, status
from app.models.team import TeamCreate, TeamUpdate, TeamOut, TeamMember, TeamMemberAdd
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
        members_list.append({
            "id": f"mem-{uuid.uuid4().hex[:6]}",
            "name": m.name,
            "email": m.email or f"{m.name.lower().replace(' ', '.')}@taskflow.cloud",
            "role": m.role or "Software Engineer",
            "avatar": m.name[0].upper() if m.name else "U",
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
            # Check if member already in team by name
            for existing in t.get("members", []):
                if existing["name"].lower() == member_in.name.lower():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Member '{member_in.name}' is already in this team."
                    )
            
            new_member = {
                "id": f"mem-{uuid.uuid4().hex[:6]}",
                "name": member_in.name,
                "email": member_in.email or f"{member_in.name.lower().replace(' ', '.')}@taskflow.cloud",
                "role": member_in.role or "Software Engineer",
                "avatar": member_in.name[0].upper() if member_in.name else "U",
                "status": "active",
                "joinedAt": datetime.now().strftime("%Y-%m-%d")
            }
            t.setdefault("members", []).append(new_member)
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
