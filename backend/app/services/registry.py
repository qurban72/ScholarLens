"""Simple JSON-file store for document metadata (swap for PostgreSQL later)."""
import json
import threading
from pathlib import Path

from app.config import settings

_lock = threading.Lock()
_path = Path(settings.data_dir) / "documents.json"


def _load() -> dict:
    if not _path.exists():
        return {}
    return json.loads(_path.read_text(encoding="utf-8"))


def _save(data: dict) -> None:
    _path.parent.mkdir(parents=True, exist_ok=True)
    _path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def upsert(doc_id: str, record: dict) -> None:
    with _lock:
        data = _load()
        data[doc_id] = record
        _save(data)


def update(doc_id: str, **fields) -> None:
    with _lock:
        data = _load()
        data[doc_id].update(fields)
        _save(data)


def get(doc_id: str) -> dict | None:
    return _load().get(doc_id)


def remove(doc_id: str) -> None:
    with _lock:
        data = _load()
        data.pop(doc_id, None)
        _save(data)


def list_all() -> list[dict]:
    return sorted(_load().values(), key=lambda r: r.get("created_at", ""), reverse=True)
