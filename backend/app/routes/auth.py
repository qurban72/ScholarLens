"""Auth routes: register, login (email + Google), /me"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GoogleLoginRequest(BaseModel):
    id_token: str  # Google-issued ID token from frontend


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", status_code=201)
def register(req: RegisterRequest):
    try:
        profile = auth_service.register_email(req.name, req.email, req.password)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
    token = auth_service.login_email(req.email, req.password)
    return {"token": token, "user": profile}


@router.post("/login")
def login(req: LoginRequest):
    try:
        token = auth_service.login_email(req.email, req.password)
    except ValueError as exc:
        raise HTTPException(401, str(exc))
    profile = auth_service.get_profile(req.email)
    return {"token": token, "user": profile}


@router.post("/google")
def google_login(req: GoogleLoginRequest):
    try:
        token = auth_service.login_google(req.id_token)
    except ValueError as exc:
        raise HTTPException(401, str(exc))
    import jwt as _jwt
    from app.services.auth import decode_token
    payload = decode_token(token)
    profile = auth_service.get_profile(payload["sub"])
    return {"token": token, "user": profile}
