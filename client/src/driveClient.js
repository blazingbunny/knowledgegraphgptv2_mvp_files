const BASE = "http://localhost:4000";

async function j(method, path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP ${r.status}`);
  }
  return data;
}

export const drive = {
  getSession: () => j("GET", "/api/session"),
  login: () => (window.location.href = `${BASE}/auth/google`),
  listDocs: () => j("GET", "/api/documents"),
  createDoc: (name, content) => j("POST", "/api/documents", { name, content }),
  openDoc: (id) => j("GET", `/api/documents/${id}`),
  saveDoc: (id, content) => j("PUT", `/api/documents/${id}`, { content }),
  saveAsDoc: (id, name) => j("POST", `/api/documents/${id}/save-as`, { name }),
  undoTo: (id, timestampIso) => j("POST", `/api/documents/${id}/undo`, { timestampIso }),
};
