const API = 'http://localhost:4000';

async function jfetch(path, options = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const drive = {
  getSession: () => jfetch('/api/session', { method: 'GET' }),
  login: () => { window.location.href = API + '/auth/google'; },
  logout: () => jfetch('/auth/logout', { method: 'POST' }),

  listDocs: () => jfetch('/api/documents', { method: 'GET' }),
  createDoc: (name, content) =>
    jfetch('/api/documents', { method: 'POST', body: JSON.stringify({ name, content }) }),
  openDoc: (id) =>
    jfetch(`/api/documents/${id}`, { method: 'GET' }),
  saveDoc: (id, content) =>
    jfetch(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
  saveAsDoc: (id, name) =>
    jfetch(`/api/documents/${id}/save-as`, { method: 'POST', body: JSON.stringify({ name }) }),
  undoTo: (id, timestampIso) =>
    jfetch(`/api/documents/${id}/undo`, { method: 'POST', body: JSON.stringify({ timestampIso }) }),
};
