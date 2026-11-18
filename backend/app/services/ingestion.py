import re
import uuid
from datetime import datetime, timezone

import fitz  # PyMuPDF

from app.config import settings
from app.services import registry, vector_store
from app.services.embeddings import embed_texts


def _clean(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pages(pdf_bytes: bytes) -> list[tuple[int, str]]:
    pages = []
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for number, page in enumerate(doc, start=1):
            text = _clean(page.get_text("text"))
            if text:
                pages.append((number, text))
    return pages


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    chunks, start, n = [], 0, len(text)
    while start < n:
        end = min(start + size, n)
        if end < n:
            cut = text.rfind(" ", start + size // 2, end)  # prefer breaking at a space
            if cut > start:
                end = cut
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return chunks


def ingest_pdf(filename: str, pdf_bytes: bytes) -> dict:
    doc_id = uuid.uuid4().hex[:12]
    registry.upsert(doc_id, {
        "document_id": doc_id,
        "document_name": filename,
        "status": "processing",
        "pages": 0,
        "chunk_count": 0,
        "chunk_ids": [],
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    try:
        pages = extract_pages(pdf_bytes)
        if not pages:
            raise ValueError("No extractable text found. Scanned PDFs need OCR, which is not in the MVP.")

        records = []
        for page_no, text in pages:
            for idx, chunk in enumerate(chunk_text(text, settings.chunk_size, settings.chunk_overlap)):
                records.append({"id": f"{doc_id}-p{page_no}-c{idx}", "text": chunk, "page": page_no})

        vectors = embed_texts([r["text"] for r in records])
        upserts = [
            {
                "id": r["id"],
                "values": v,
                "metadata": {
                    "document_id": doc_id,
                    "document_name": filename,
                    "page_number": r["page"],
                    "chunk_id": r["id"],
                    "text": r["text"],
                },
            }
            for r, v in zip(records, vectors)
        ]
        vector_store.upsert_vectors(upserts)

        registry.update(doc_id, status="ready", pages=len(pages),
                        chunk_count=len(records), chunk_ids=[r["id"] for r in records])
    except Exception as e:  # keep the record so the admin sees why it failed
        registry.update(doc_id, status="failed", error=str(e))

    return registry.get(doc_id)
