"""
Run this script ONCE to create the initial admin account.
Usage: python backend/create_admin.py

It will ask for name, email, and password interactively.
"""
import sys
import os
from pathlib import Path

# Make sure app module is importable
sys.path.insert(0, str(Path(__file__).parent))

# Load env
from dotenv import load_dotenv
ROOT = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT / ".env")

import json
import threading
import uuid
from datetime import datetime, timezone
import bcrypt

DATA_DIR = os.getenv("DATA_DIR", "data")
USERS_FILE = Path(DATA_DIR) / "users.json"


def _hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def load():
    if not USERS_FILE.exists():
        return {}
    return json.loads(USERS_FILE.read_text(encoding="utf-8"))


def save(data):
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    USERS_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def create_admin():
    print("\n=== ScholarLens — Create Admin Account ===\n")
    name = input("Admin name  : ").strip()
    email = input("Admin email : ").strip().lower()
    password = input("Password    : ").strip()

    if len(password) < 6:
        print("❌ Password must be at least 6 characters.")
        sys.exit(1)

    data = load()
    if email in data:
        # Promote existing user to admin
        data[email]["is_admin"] = True
        data[email]["hashed_password"] = _hash_password(password)
        save(data)
        print(f"\n✅ Existing account '{email}' has been promoted to admin.")
        return

    data[email] = {
        "user_id": uuid.uuid4().hex[:12],
        "name": name,
        "email": email,
        "hashed_password": _hash_password(password),
        "provider": "email",
        "is_admin": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    save(data)
    print(f"\n✅ Admin account created successfully!")
    print(f"   Email : {email}")
    print(f"   Role  : Administrator (can upload & delete documents)")
    print(f"\nNow run the backend and log in at http://localhost:5173\n")


if __name__ == "__main__":
    create_admin()
