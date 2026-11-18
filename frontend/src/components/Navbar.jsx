import { useState } from "react";
import { clearSession, getUser, isAdmin, isAuthenticated } from "../services/session.js";
import { GraduationCapIcon, FileTextIcon, SparklesIcon, UserIcon } from "./Icons.jsx";
import AuthModal from "./AuthModal.jsx";

function ChevronIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ShieldIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function Navbar({ activeTab, onTabChange }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [user, setUser] = useState(() => getUser());
  const [showDropdown, setShowDropdown] = useState(false);

  function handleAuthSuccess(newUser) {
    setUser(newUser);
    setShowAuth(false);
    setShowDropdown(false);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setShowDropdown(false);
    // If on Documents tab (admin only) and no longer admin, go to chat
    onTabChange("ask");
  }

  function openSignIn() {
    setAuthMode("signin");
    setShowAuth(true);
  }

  function openSignUp() {
    setAuthMode("signup");
    setShowAuth(true);
  }

  const loggedIn = !!user;
  const admin = user?.is_admin === true;

  const TABS = [
    { id: "ask", label: "Ask Assistant", icon: SparklesIcon },
    ...(admin ? [{ id: "documents", label: "Manage Documents", icon: FileTextIcon }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <GraduationCapIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-lg text-slate-900 tracking-tight">ScholarLens</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
                  AI Grounded
                </span>
                {admin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                    <ShieldIcon className="w-3 h-3" />
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Scholarship & Admission Guidance Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab Nav */}
            <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
              {TABS.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTabChange(t.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Auth Area */}
            {loggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown((s) => !s)}
                  className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-24 truncate">
                    {user.name}
                  </span>
                  <ChevronIcon className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-premium overflow-hidden z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {admin && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                          <ShieldIcon className="w-2.5 h-2.5" />
                          Administrator
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openSignIn}
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={openSignUp}
                  className="text-xs sm:text-sm font-semibold bg-gradient-to-tr from-brand-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-lg hover:opacity-90 transition-opacity shadow-xs"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
