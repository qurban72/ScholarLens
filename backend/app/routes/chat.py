import re
from collections import defaultdict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.llm import generate_answer
from app.services.retrieval import retrieve

router = APIRouter(prefix="/api/chat", tags=["chat"])
_history: dict[str, list[dict]] = defaultdict(list)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    session_id: str = Field(min_length=1, max_length=100)
    document_id: str | None = None


def _select_sources(raw: str, passages: list[dict]) -> list[dict]:
    """Keep only the passages the model actually cited as [n]."""
    cited = {int(n) for n in re.findall(r"\[(\d+)\]", raw)}
    return [passages[i - 1] for i in sorted(cited) if 1 <= i <= len(passages)]


def _friendly_error(exc: Exception) -> str:
    msg = str(exc).lower()
    if "getaddrinfo" in msg or "nameresolution" in msg or "connection" in msg or "resolve" in msg:
        return (
            "Could not connect to the AI service. "
            "Please check your internet connection and try again."
        )
    if "api_key" in msg or "api key" in msg or "unauthorized" in msg or "403" in msg:
        return "Invalid or missing API key. Please check your configuration."
    if "quota" in msg or "429" in msg or "rate" in msg:
        return "API quota exceeded. Please wait a moment and try again."
    return f"Service error: {exc}"


@router.post("")
def chat(req: ChatRequest):
    # --- Retrieval ---
    try:
        passages = retrieve(req.question, req.document_id)
    except Exception as e:
        raise HTTPException(503, _friendly_error(e))

    # --- Generation ---
    try:
        raw = generate_answer(req.question, passages)
    except Exception as e:
        raise HTTPException(503, _friendly_error(e))

    answer = raw.strip() if raw else "I'm here to assist you with scholarship and admission inquiries. How can I help?"

    sources = [
        {"document": p["document"], "page": p["page"], "content": p["content"][:400]}
        for p in _select_sources(answer, passages)
    ] if passages else []

    _history[req.session_id].append({"role": "user", "text": req.question})
    _history[req.session_id].append({"role": "assistant", "text": answer, "sources": sources})
    return {"answer": answer, "sources": sources, "session_id": req.session_id}


@router.get("/history")
def history(session_id: str):
    return {"session_id": session_id, "messages": _history.get(session_id, [])}
