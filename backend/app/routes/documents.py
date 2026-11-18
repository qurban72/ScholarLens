from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.config import settings
from app.services import registry, vector_store
from app.services.deps import require_admin
from app.services.ingestion import ingest_pdf

router = APIRouter(prefix="/api/documents", tags=["documents"])
MAX_BYTES = settings.max_upload_mb * 1024 * 1024


@router.get("")
def list_documents():
    """Public – anyone can list documents."""
    return {"documents": registry.list_all()}


@router.post("/upload", status_code=201)
def upload_document(
    file: UploadFile = File(...),
    _admin: dict = Depends(require_admin),
):
    """Admin only – upload and index a PDF."""
    name = (file.filename or "").strip()
    if not name.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted.")

    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"File is larger than {settings.max_upload_mb} MB.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(400, "File does not look like a valid PDF.")

    return ingest_pdf(name, data)


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    _admin: dict = Depends(require_admin),
):
    """Admin only – delete a document and its vectors."""
    record = registry.get(document_id)
    if not record:
        raise HTTPException(404, "Document not found.")

    chunk_ids = record.get("chunk_ids", [])
    if chunk_ids:
        vector_store.delete_ids(chunk_ids)
    registry.remove(document_id)
    return {"deleted": document_id, "vectors_removed": len(chunk_ids)}
