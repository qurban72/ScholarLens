from functools import lru_cache

from pinecone import Pinecone

from app.config import settings


@lru_cache(maxsize=1)
def _index():
    if not settings.pinecone_api_key:
        raise RuntimeError("PINECONE_API_KEY is not set.")
    return Pinecone(api_key=settings.pinecone_api_key).Index(settings.pinecone_index)


def upsert_vectors(vectors: list[dict], batch_size: int = 100) -> None:
    for i in range(0, len(vectors), batch_size):
        _index().upsert(vectors=vectors[i : i + batch_size], namespace=settings.pinecone_namespace)


def query(vector: list[float], top_k: int, document_id: str | None = None):
    flt = {"document_id": {"$eq": document_id}} if document_id else None
    res = _index().query(
        vector=vector,
        top_k=top_k,
        include_metadata=True,
        namespace=settings.pinecone_namespace,
        filter=flt,
    )
    return res.matches


def delete_ids(ids: list[str], batch_size: int = 1000) -> None:
    for i in range(0, len(ids), batch_size):
        _index().delete(ids=ids[i : i + batch_size], namespace=settings.pinecone_namespace)
