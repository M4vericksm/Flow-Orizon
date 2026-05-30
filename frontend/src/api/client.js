import axios from "axios";

import {
  clearSession,
  getAccess,
  getRefresh,
  loadSession,
  saveSession,
} from "../lib/session.js";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({ baseURL });

// Anexa o access token em toda requisição autenticada.
api.interceptors.request.use((config) => {
  const token = getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Em caso de 401, tenta renovar o access token uma vez usando o refresh.
// Se o refresh também falhar, encerra a sessão e manda para o login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response ? error.response.status : null;

    if (status === 401 && original && !original._retry && getRefresh()) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh: getRefresh(),
        });
        const session = loadSession() || {};
        saveSession({ ...session, access: data.access });
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        clearSession();
        window.location.assign("/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Percorre todas as páginas de um endpoint paginado (PageNumberPagination)
// e devolve a lista completa — usado pelo quadro, que mostra tudo de uma vez.
export async function getAllPages(path, params = {}) {
  let results = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await api.get(path, { params: { ...params, page } });
    if (Array.isArray(data)) {
      return data;
    }
    results = results.concat(data.results);
    if (!data.next) {
      break;
    }
    page += 1;
  }
  return results;
}
