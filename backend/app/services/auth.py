"""
Authentication service:
  - Email/password sign-up & sign-in (bcrypt + JWT)
  - Google OAuth token verification via google-auth library
  - Admin flag stored per-user in users.json (simple JSON store)
"""
import bcrypt
import json
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.config import settings

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
_SECRET = settings.jwt_secret
_ALGO = "HS256"
_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days

_lock = threading.Lock()
_path = Path(settings.data_dir) / "users.json"


def _hash_password(password: str) -> str:
    """Hash password using native bcrypt with safe 72-byte truncation."""
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    """Verify password using native bcrypt with safe 72-byte truncation."""
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))


# ---------------------------------------------------------------------------
# User store helpers
# ---------------------------------------------------------------------------

def _load() -> dict:
    if not _path.exists():
        return {}
    return json.loads(_path.read_text(encoding="utf-8"))


def _save(data: dict) -> None:
    _path.parent.mkdir(parents=True, exist_ok=True)
    _path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def _get_by_email(email: str) -> dict | None:
    return _load().get(email.lower())


def _upsert_user(user: dict) -> None:
    with _lock:
        data = _load()
        data[user["email"]] = user
        _save(data)


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def _create_token(payload: dict) -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=_TOKEN_EXPIRE_HOURS)
    return jwt.encode({**payload, "exp": exp}, _SECRET, algorithm=_ALGO)


def decode_token(token: str) -> dict:
    """Returns payload dict or raises jwt.PyJWTError."""
    return jwt.decode(token, _SECRET, algorithms=[_ALGO])


# ---------------------------------------------------------------------------
# Email auth
# ---------------------------------------------------------------------------

def register_email(name: str, email: str, password: str) -> dict:
    email = email.lower().strip()
    with _lock:
        data = _load()
        if email in data:
            raise ValueError("An account with this email already exists.")
        user = {
            "user_id": uuid.uuid4().hex[:12],
            "name": name.strip(),
            "email": email,
            "hashed_password": _hash_password(password),
            "provider": "email",
            "is_admin": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        data[email] = user
        _save(data)
    return _user_public(user)


def login_email(email: str, password: str) -> str:
    email = email.lower().strip()
    user = _get_by_email(email)
    if not user or not user.get("hashed_password"):
        raise ValueError("Invalid email or password.")
    if not _verify_password(password, user["hashed_password"]):
        raise ValueError("Invalid email or password.")
    return _create_token({"sub": email, "is_admin": user.get("is_admin", False)})


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

def login_google(id_token_str: str) -> str:
    """Verify Google ID token, upsert user, return JWT."""
    try:
        info = google_id_token.verify_oauth2_token(
            id_token_str,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception as exc:
        raise ValueError(f"Invalid Google token: {exc}")

    email = info["email"].lower()
    with _lock:
        data = _load()
        user = data.get(email)
        if not user:
            user = {
                "user_id": uuid.uuid4().hex[:12],
                "name": info.get("name", ""),
                "email": email,
                "hashed_password": None,
                "provider": "google",
                "picture": info.get("picture", ""),
                "is_admin": False,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            data[email] = user
            _save(data)
    return _create_token({"sub": email, "is_admin": user.get("is_admin", False)})


# ---------------------------------------------------------------------------
# Public profile
# ---------------------------------------------------------------------------

def _user_public(user: dict) -> dict:
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False),
        "picture": user.get("picture", ""),
        "provider": user.get("provider", "email"),
    }


def get_profile(email: str) -> dict | None:
    user = _get_by_email(email)
    return _user_public(user) if user else None
