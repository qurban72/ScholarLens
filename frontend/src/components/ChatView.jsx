import { useEffect, useRef, useState } from "react";
import { askQuestion, listDocuments } from "../services/api.js";
import {
  SparklesIcon,
  SendIcon,
  FileTextIcon,
  BookOpenIcon,
  RefreshIcon,
  AlertCircleIcon,
  UserIcon,
} from "./Icons.jsx";

const SUGGESTIONS = [
  "What are the eligibility requirements for the scholarship?",
  "What is the final deadline to submit applications?",
  "What supporting documents are required?",
  "How much financial allowance or tuition waiver is covered?",
];

export default function ChatView({ sessionId, onNewChat }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docId, setDocId] = useState("");
  const [expandedSource, setExpandedSource] = useState(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    listDocuments()
      .then((r) => setDocuments(r.documents.filter((d) => d.status === "ready")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function handleSuggestionClick(text) {
    setInput(text);
    inputRef.current?.focus();
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || busy) return;

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: question }]);

    try {
      const res = await askQuestion({
        question,
        session_id: sessionId,
        document_id: docId || null,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.answer, sources: res.sources || [] },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: err.message || "Failed to fetch response. Please ensure backend is running.",
          error: true,
          sources: [],
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleClearChat() {
    setMessages([]);
    onNewChat?.();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Top Controls: Document Filter & New Chat */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="doc-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileTextIcon className="w-3.5 h-3.5 text-brand-600" />
            Filter By
          </label>
          <select
            id="doc-filter"
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
          >
            <option value="">All Uploaded Documents ({documents.length})</option>
            {documents.map((d) => (
              <option key={d.document_id} value={d.document_id}>
                {d.document_name}
              </option>
            ))}
          </select>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
            New Chat
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        {messages.length === 0 ? (
          /* Empty State Hero */
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 max-w-xl mx-auto my-auto animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-100 via-brand-50 to-indigo-100 flex items-center justify-center text-brand-600 mb-4 shadow-xs border border-brand-200/60">
              <SparklesIcon className="w-7 h-7" />
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              How can I assist your scholarship search?
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              Ask questions about eligibility criteria, deadlines, fee waivers, or required forms.
              Every response is cross-referenced with uploaded official documents.
            </p>

            {/* Quick Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="p-3 text-xs sm:text-sm rounded-xl border border-slate-200/80 bg-white hover:bg-brand-50/50 hover:border-brand-300 text-slate-700 transition-all text-left shadow-2xs hover:shadow-xs group"
                >
                  <span className="text-brand-500 font-semibold mr-1.5 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat History */
          <div className="space-y-6 pb-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                /* User Message */
                <div key={i} className="flex justify-end gap-2.5 animate-fadeIn">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-brand-600 text-white px-4 py-3 shadow-sm text-sm sm:text-base leading-relaxed">
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 text-xs font-semibold">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                /* Assistant Message */
                <div key={i} className="flex gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <SparklesIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 max-w-[90%] sm:max-w-[85%] space-y-3">
                    <div
                      className={`p-4 rounded-2xl rounded-tl-xs border ${
                        m.error
                          ? "bg-rose-50/80 border-rose-200 text-rose-900"
                          : "bg-white border-slate-200/90 text-slate-800 shadow-card"
                      }`}
                    >
                      {m.error && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-2">
                          <AlertCircleIcon className="w-4 h-4" />
                          Response Error
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed font-normal">
                        {m.text}
                      </p>
                    </div>

                    {/* Sources & Citations */}
                    {m.sources?.length > 0 && (
                      <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <BookOpenIcon className="w-3.5 h-3.5 text-brand-600" />
                          <span>Referenced Sources ({m.sources.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {m.sources.map((s, j) => {
                            const isExpanded = expandedSource === `${i}-${j}`;
                            return (
                              <div
                                key={j}
                                onClick={() => setExpandedSource(isExpanded ? null : `${i}-${j}`)}
                                className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 hover:border-brand-300 transition-colors cursor-pointer shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                                    {s.document}
                                  </span>
                                  <span className="shrink-0 bg-brand-50 text-brand-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-brand-200/60">
                                    Page {s.page}
                                  </span>
                                </div>
                                <p className={`italic text-slate-500 leading-normal ${isExpanded ? "" : "line-clamp-2"}`}>
                                  "{s.content}"
                                </p>
                                <span className="text-[10px] text-brand-600 font-medium mt-1 inline-block">
                                  {isExpanded ? "Show less" : "Click to view excerpt"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Busy / Thinking Indicator */}
            {busy && (
              <div className="flex gap-3 animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <SparklesIcon className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-card flex items-center gap-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-600 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Retrieving passages & grounding response…
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="pt-3 pb-1 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center rounded-2xl bg-white border border-slate-300/80 shadow-premium focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all p-1.5"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder={
              documents.length === 0
                ? "Upload documents first in the 'Manage Documents' tab..."
                : "Ask about eligibility, deadlines, stipend amount..."
            }
            disabled={busy}
            className="flex-1 bg-transparent px-4 py-2.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white disabled:opacity-40 hover:opacity-95 shadow-xs transition-opacity shrink-0 cursor-pointer disabled:cursor-not-allowed"
            title="Send query"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-center text-slate-400 mt-1.5">
          Answers generated strictly from verified document vectors. No hallucinated data.
        </p>
      </div>
    </div>
  );
}
