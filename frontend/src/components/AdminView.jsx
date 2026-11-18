import { useEffect, useState, useRef } from "react";
import { deleteDocument, listDocuments, uploadDocument } from "../services/api.js";
import {
  UploadCloudIcon,
  FileTextIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  DatabaseIcon,
} from "./Icons.jsx";

export default function AdminView({ onDocumentChanged }) {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  async function refresh() {
    try {
      const r = await listDocuments();
      setDocs(r.documents || []);
      onDocumentChanged?.();
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Failed to load document list." });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setStatusMessage({ type: "error", text: "Please drop a valid PDF file." });
    }
  }

  async function handleUpload(e) {
    e?.preventDefault();
    if (!file || busy) return;

    setBusy(true);
    setStatusMessage({
      type: "info",
      text: `Processing and vectorizing "${file.name}"... This may take a moment.`,
    });

    try {
      const doc = await uploadDocument(file);
      if (doc.status === "ready") {
        setStatusMessage({
          type: "success",
          text: `Successfully indexed "${doc.document_name}" (${doc.chunk_count} passages from ${doc.pages} pages).`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: `Failed to index "${doc.document_name}": ${doc.error || "Unknown error"}`,
        });
      }
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await refresh();
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.document_name}" and remove all vectors from Pinecone?`)) {
      return;
    }
    try {
      await deleteDocument(doc.document_id);
      setStatusMessage({
        type: "success",
        text: `Deleted "${doc.document_name}" and removed vector embeddings.`,
      });
      await refresh();
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Delete failed." });
    }
  }

  // Calculate metrics
  const totalPassages = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const readyDocs = docs.filter((d) => d.status === "ready").length;

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <FileTextIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-heading font-bold text-slate-900">{readyDocs}</div>
            <div className="text-xs font-medium text-slate-500">Active Documents</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <DatabaseIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-heading font-bold text-slate-900">{totalPassages}</div>
            <div className="text-xs font-medium text-slate-500">Indexed Passages</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-card flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Pinecone Connected
            </div>
            <div className="text-xs font-medium text-slate-500">Serverless Vector DB</div>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900">Upload Knowledge Documents</h2>
          <p className="text-xs text-slate-500">
            Upload institutional guidelines, scholarship criteria, or admission rules (PDF up to 20 MB).
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? "border-brand-500 bg-brand-50/50 scale-[0.99]"
              : "border-slate-300 hover:border-brand-400 hover:bg-slate-50/80 bg-slate-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-white text-brand-600 shadow-xs border border-slate-200 flex items-center justify-center mb-3">
            <UploadCloudIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload <span className="font-normal text-slate-500">or drag & drop</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Text-based PDF files only (max 20 MB)</p>
        </div>

        {/* Selected File Card & Actions */}
        {file && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-brand-50/60 border border-brand-200/80 animate-fadeIn">
            <div className="flex items-center gap-2.5 truncate max-w-md">
              <FileTextIcon className="w-5 h-5 text-brand-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2.5 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {busy ? "Vectorizing…" : "Start Ingestion"}
              </button>
            </div>
          </div>
        )}

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : statusMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-brand-50 border-brand-200 text-brand-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === "error" ? (
              <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <RefreshIcon className="w-4 h-4 text-brand-600 shrink-0 mt-0.5 animate-spin" />
            )}
            <div className="flex-1 font-medium leading-relaxed">{statusMessage.text}</div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Indexed Documents Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Knowledge Base Index</h2>
            <p className="text-xs text-slate-500">Currently indexed documents available for student queries.</p>
          </div>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400">
            <FileTextIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-600">No documents indexed yet.</p>
            <p className="text-xs text-slate-400 mt-1">Upload a PDF above to build your institution's knowledge base.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Document</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pages</th>
                  <th className="py-3 px-4">Passages</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((d) => (
                  <tr key={d.document_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                          <FileTextIcon className="w-4 h-4" />
                        </div>
                        <div className="max-w-[240px] sm:max-w-xs truncate">
                          <p className="font-semibold text-slate-900 truncate">{d.document_name}</p>
                          <p className="text-[10px] text-slate-400">ID: {d.document_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {d.status === "ready" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Ready
                        </span>
                      ) : d.status === "failed" ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Failed
                          </span>
                          {d.error && (
                            <p className="text-[11px] text-rose-600 mt-1 max-w-xs truncate" title={d.error}>
                              {d.error}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          Processing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {d.pages || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                        {d.chunk_count || 0} vectors
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => handleDelete(d)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 px-2.5 py-1 rounded-lg transition-colors"
                        title="Delete document and Pinecone vectors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
