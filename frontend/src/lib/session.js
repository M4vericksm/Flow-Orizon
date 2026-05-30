// Persistência da sessão (tokens JWT + usuário) no localStorage.
const KEY = "fo-auth";

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function saveSession(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function getAccess() {
  const s = loadSession();
  return s ? s.access : null;
}

export function getRefresh() {
  const s = loadSession();
  return s ? s.refresh : null;
}
