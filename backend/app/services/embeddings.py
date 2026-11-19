from google import genai
from google.genai import types

from app.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def embed_texts(texts: list[str], batch_size: int = 50) -> list[list[float]]:
    """Embed texts using Gemini Embedding API (gemini-embedding-001)."""
    if not texts:
        return []

    client = _get_client()
    results = []

    # Batch calls to avoid request size limits
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.models.embed_content(
            model=settings.embedding_model,
            contents=batch,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=768,
            ),
        )
        for emb in response.embeddings:
            results.append(emb.values)

    return results


def embed_query(text: str) -> list[float]:
    """Embed search query with RETRIEVAL_QUERY task type for optimal retrieval."""
    client = _get_client()
    response = client.models.embed_content(
        model=settings.embedding_model,
        contents=text,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=768,
        ),
    )
    if response.embeddings:
        return response.embeddings[0].values
    raise RuntimeError("No embedding returned from Gemini.")
