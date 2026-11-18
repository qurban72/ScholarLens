from app.config import settings
from app.services import vector_store
from app.services.embeddings import embed_query


def retrieve(question: str, document_id: str | None = None) -> list[dict]:
    """Return the most relevant passages with metadata taken directly from Pinecone."""
    vector = embed_query(question)
    matches = vector_store.query(vector, settings.top_k, document_id)

    passages = []
    for m in matches:
        if m.score < settings.min_score:
            continue
        md = m.metadata or {}
        passages.append({
            "document": md.get("document_name", "Unknown document"),
            "page": md.get("page_number"),
            "content": md.get("text", ""),
            "score": float(m.score),
            "chunk_id": md.get("chunk_id"),
        })
    return passages
