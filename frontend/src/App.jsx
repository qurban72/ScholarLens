import { useState } from "react";
import ChatView from "./components/ChatView.jsx";
import AdminView from "./components/AdminView.jsx";
import Navbar from "./components/Navbar.jsx";
import { isAdmin } from "./services/session.js";

export default function App() {
  const [tab, setTab] = useState("ask");
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());

  function handleTabChange(newTab) {
    // Guard: only admin can access documents
    if (newTab === "documents" && !isAdmin()) return;
    setTab(newTab);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/80 to-slate-100/90 flex flex-col font-sans">
      <Navbar activeTab={tab} onTabChange={handleTabChange} />

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {tab === "ask" ? (
          <ChatView
            sessionId={sessionId}
            onNewChat={() => setSessionId(crypto.randomUUID())}
          />
        ) : (
          <AdminView onDocumentChanged={() => {}} />
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/50 py-4 text-center text-xs text-slate-400">
        <p>ScholarLens AI answers are strictly grounded in uploaded institutional documents with verified citations.</p>
      </footer>
    </div>
  );
}
