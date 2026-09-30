import os
import json
import uuid
import secrets
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
USERS_FILE = DATA_DIR / "users.json"

def _hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return hashed, salt

def _verify_password(password: str, stored_hash: str, salt: str) -> bool:
    candidate_hash, _ = _hash_password(password, salt)
    return secrets.compare_digest(candidate_hash, stored_hash)

DEFAULT_USERS = [
    {
        "id": "usr-mgr-101",
        "name": "Sabarinathan V",
        "email": "sabarinathan.mgr@taskflow.cloud",
        "passwordHash": _hash_password("Password123!", "default_mgr_salt_01")[0],
        "salt": "default_mgr_salt_01",
        "role": "manager",
        "title": "Engineering Manager",
        "picture": None,
        "createdAt": "2026-09-18T09:00:00"
    },
    {
        "id": "usr-tl-103",
        "name": "Sabarinathan V",
        "email": "sabarinathan.tl@taskflow.cloud",
        "passwordHash": _hash_password("Password123!", "default_tl_salt_03")[0],
        "salt": "default_tl_salt_03",
        "role": "teamleader",
        "title": "Team Leader (TL)",
        "picture": None,
        "createdAt": "2026-09-18T09:00:00"
    },
    {
        "id": "usr-emp-102",
        "name": "Sabarinathan V",
        "email": "sabarinathan.emp@taskflow.cloud",
        "passwordHash": _hash_password("Password123!", "default_emp_salt_02")[0],
        "salt": "default_emp_salt_02",
        "role": "employee",
        "title": "Senior Cloud Engineer",
        "picture": None,
        "createdAt": "2026-09-18T09:00:00"
    }
]

class UserService:
    def __init__(self):
        self._ensure_storage()

    def _ensure_storage(self):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not USERS_FILE.exists():
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_USERS, f, indent=2)

    def _read_users(self) -> List[Dict[str, Any]]:
        self._ensure_storage()
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return DEFAULT_USERS

    def _write_users(self, users: List[Dict[str, Any]]) -> None:
        self._ensure_storage()
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        users = self._read_users()
        for u in users:
            if u.get("email", "").lower() == clean_email:
                return u
        return None

    def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        users = self._read_users()
        for u in users:
            if u.get("id") == user_id:
                return u
        return None

    def register(self, name: str, email: str, password: str, role: str = "manager") -> Dict[str, Any]:
        clean_email = email.strip().lower()
        if self.find_by_email(clean_email):
            raise ValueError(f"An account with email '{clean_email}' already exists. Please log in.")

        password_hash, salt = _hash_password(password)
        user_id = f"usr-{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow().isoformat()

        if role == "manager":
            title = "Engineering Manager"
        elif role in ["teamleader", "tl"]:
            title = "Team Leader (TL)"
        else:
            title = "Cloud Developer"

        new_user = {
            "id": user_id,
            "name": name.strip(),
            "email": clean_email,
            "passwordHash": password_hash,
            "salt": salt,
            "role": "teamleader" if role in ["teamleader", "tl"] else role,
            "title": title,
            "picture": None,
            "createdAt": now
        }

        users = self._read_users()
        users.append(new_user)
        self._write_users(users)
        return new_user

    def authenticate(self, email: str, password: str, preferred_role: Optional[str] = None) -> tuple[Dict[str, Any], str]:
        clean_email = email.strip().lower()
        user = self.find_by_email(clean_email)
        if not user:
            raise ValueError(f"No account found with email '{clean_email}'. Please register first.")

        stored_hash = user.get("passwordHash", "")
        salt = user.get("salt", "")

        if not _verify_password(password, stored_hash, salt):
            raise ValueError("Incorrect password. Please verify your credentials.")

        # Update role if user explicitly selected a role during login
        normalized_role = "teamleader" if preferred_role in ["teamleader", "tl"] else preferred_role
        if normalized_role and normalized_role in ["manager", "teamleader", "employee"] and normalized_role != user.get("role"):
            user["role"] = normalized_role
            if normalized_role == "manager":
                user["title"] = "Engineering Manager"
            elif normalized_role == "teamleader":
                user["title"] = "Team Leader (TL)"
            else:
                user["title"] = "Senior Cloud Engineer"
            users = self._read_users()
            for i, u in enumerate(users):
                if u["id"] == user["id"]:
                    users[i] = user
                    break
            self._write_users(users)

        token = f"tok_{secrets.token_urlsafe(32)}"
        return user, token

    def authenticate_google(self, email: str, name: str, picture: Optional[str] = None, role: str = "manager") -> tuple[Dict[str, Any], str]:
        clean_email = email.strip().lower()
        user = self.find_by_email(clean_email)

        if not user:
            # Auto-register new Google user
            user_id = f"usr-g-{uuid.uuid4().hex[:10]}"
            now = datetime.utcnow().isoformat()
            title = "Engineering Manager" if role == "manager" else "Cloud Developer"

            user = {
                "id": user_id,
                "name": name.strip() or "Google User",
                "email": clean_email,
                "passwordHash": "oauth_google",
                "salt": "oauth",
                "role": role or "manager",
                "title": title,
                "picture": picture,
                "createdAt": now
            }
            users = self._read_users()
            users.append(user)
            self._write_users(users)
        else:
            # Update profile image if provided
            if picture and user.get("picture") != picture:
                user["picture"] = picture
                users = self._read_users()
                for i, u in enumerate(users):
                    if u["id"] == user["id"]:
                        users[i] = user
                        break
                self._write_users(users)

        token = f"tok_{secrets.token_urlsafe(32)}"
        return user, token

user_service = UserService()
