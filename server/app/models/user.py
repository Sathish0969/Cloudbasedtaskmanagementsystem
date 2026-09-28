import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class UserRegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=100, description="User's full name")
    email: str = Field(..., description="User's email address (Gmail preferred)")
    password: str = Field(..., min_length=6, max_length=128, description="User's password")
    role: str = Field("manager", description="manager or employee")

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        email_regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_regex, clean):
            raise ValueError("Please provide a valid email address.")
        return clean

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ["manager", "employee"]:
            return "manager"
        return clean

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User's registered email")
    password: str = Field(..., description="User's password")
    role: Optional[str] = Field(None, description="Optional role preference")

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return v.strip().lower()

class GoogleAuthRequest(BaseModel):
    credentialToken: Optional[str] = None
    email: str = Field(..., description="User's Google email")
    name: str = Field(..., description="User's Google display name")
    picture: Optional[str] = None
    role: Optional[str] = "manager"

    @field_validator("email")
    @classmethod
    def clean_email(cls, v: str) -> str:
        return v.strip().lower()

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    title: Optional[str] = None
    picture: Optional[str] = None
    createdAt: str

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: UserResponse
    token: str
