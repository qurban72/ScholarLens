from google import genai

from app.config import settings
from app.prompts.answer import build_prompt

_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def generate_answer(question: str, passages: list[dict]) -> str:
    prompt = build_prompt(question, passages)
    response = _get_client().models.generate_content(model=settings.gemini_model, contents=prompt)
    return (response.text or "").strip()
