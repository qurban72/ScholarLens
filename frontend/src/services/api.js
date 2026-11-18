import { getToken } from "./session.js";

const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.json) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.json);
    delete options.json;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || `Request failed (${res.status})`);
  }
  return data;
}

// Documents
export const listDocuments = () => request("/api/documents");
export const uploadDocument = (file) => {
  const form = new FormData();
  form.append("file", file);
  return request("/api/documents/upload", { method: "POST", body: form });
};
export const deleteDocument = (id) =>
  request(`/api/documents/${id}`, { method: "DELETE" });

// Chat
export const askQuestion = (payload) =>
  request("/api/chat", { method: "POST", json: payload });

// Auth
export const registerEmail = (name, email, password) =>
  request("/api/auth/register", { method: "POST", json: { name, email, password } });

export const loginEmail = (email, password) =>
  request("/api/auth/login", { method: "POST", json: { email, password } });

export const loginGoogle = (id_token) =>
  request("/api/auth/google", { method: "POST", json: { id_token } });

