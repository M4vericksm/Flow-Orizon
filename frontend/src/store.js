/* ============================================================
   Flow Orizon — stores globais (theme + auth + board + toasts)
   Pub/sub leve com optimistic updates e rollback sobre a API real.
   ============================================================ */
import { useEffect, useReducer } from "react";

import { fetchMe, login as loginApi, register as registerApi } from "./api/auth.js";
import {
  createCategory,
  deleteCategory as deleteCategoryApi,
  listCategories,
  updateCategory as updateCategoryApi,
} from "./api/categories.js";
import { createShare, revokeShare } from "./api/shares.js";
import {
  createTask,
  deleteTask as deleteTaskApi,
  listTasks,
  toggleTask,
  updateTask as updateTaskApi,
} from "./api/tasks.js";
import { DEFAULT_COLOR } from "./data.js";
import { clearSession, loadSession, saveSession } from "./lib/session.js";

// ---- fábrica de store pub/sub ----
function createStore(initial) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    set: (patch) => {
      state =
        typeof patch === "function"
          ? { ...state, ...patch(state) }
          : { ...state, ...patch };
      subs.forEach((fn) => fn(state));
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// Hook React: re-renderiza o componente quando o store muda.
export function useStore(store, selector) {
  const sel = selector || ((s) => s);
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => store.subscribe(() => force()), [store]);
  return sel(store.get());
}

const clone = (x) => JSON.parse(JSON.stringify(x));

// =================== TOASTS ===================
const toastStore = createStore({ items: [] });
let _toastId = 0;
function toast(message, kind = "info") {
  const id = ++_toastId;
  toastStore.set((s) => ({ items: [...s.items, { id, message, kind }] }));
  setTimeout(() => {
    toastStore.set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  }, 3200);
}

// =================== THEME ===================
const THEMES = ["classic", "notebook", "cork", "night"];
const storedTheme = localStorage.getItem("fo-theme");
const themeStore = createStore({
  current: THEMES.includes(storedTheme) ? storedTheme : "classic",
});
function setTheme(t) {
  if (!THEMES.includes(t)) return;
  localStorage.setItem("fo-theme", t);
  document.documentElement.setAttribute("data-theme", t);
  themeStore.set({ current: t });
}
document.documentElement.setAttribute("data-theme", themeStore.get().current);

// =================== AUTH ===================
const stored = loadSession();
const authStore = createStore({
  user: stored ? stored.user : null,
  access: stored ? stored.access : null,
  refresh: stored ? stored.refresh : null,
});

async function login(username, password) {
  const { data } = await loginApi(username, password);
  saveSession({ access: data.access, refresh: data.refresh });
  const { data: user } = await fetchMe();
  const session = { user, access: data.access, refresh: data.refresh };
  saveSession(session);
  authStore.set(session);
  return user;
}

async function register(payload) {
  await registerApi(payload);
  return login(payload.username, payload.password);
}

function logout() {
  clearSession();
  authStore.set({ user: null, access: null, refresh: null });
}

// =================== BOARD ===================
const boardStore = createStore({
  categories: [],
  tasks: [],
  loading: false,
  loaded: false,
});

const _tasks = () => boardStore.get().tasks;
const _cats = () => boardStore.get().categories;

// Remove campos read-only e normaliza cor vazia antes de mandar à API.
function toApiPatch(patch) {
  const out = { ...patch };
  delete out.shares;
  delete out.owner;
  delete out.id;
  if ("color" in out && !out.color) out.color = "";
  // O campo é DateTimeField; uma data pura (YYYY-MM-DD) precisa de hora.
  if (out.due_date && /^\d{4}-\d{2}-\d{2}$/.test(out.due_date)) {
    out.due_date = `${out.due_date}T00:00:00`;
  }
  return out;
}

async function fetchAll() {
  boardStore.set({ loading: true });
  try {
    const [categories, tasks] = await Promise.all([listCategories(), listTasks()]);
    boardStore.set({ categories, tasks, loading: false, loaded: true });
  } catch {
    boardStore.set({ loading: false });
    toast("Falha ao carregar o quadro", "error");
  }
}

async function addTask(data) {
  const payload = toApiPatch({
    title: data.title || "Novo post-it",
    description: data.description || "",
    category: data.category,
    color: data.color || "",
    priority: data.priority || "medium",
    due_date: data.due_date || null,
    is_highlighted: !!data.is_highlighted,
    is_completed: !!data.is_completed,
    display_order: data.display_order || 0,
  });
  try {
    const { data: task } = await createTask(payload);
    boardStore.set((s) => ({ tasks: [...s.tasks, task] }));
    toast("Post-it criado", "success");
    return task;
  } catch {
    toast("Falha ao criar post-it", "error");
    return null;
  }
}

async function updateTask(id, patch, opts = {}) {
  const before = clone(_tasks());
  boardStore.set((s) => ({
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }));
  try {
    const { data: updated } = await updateTaskApi(id, toApiPatch(patch));
    boardStore.set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    return true;
  } catch {
    boardStore.set({ tasks: before });
    if (!opts.silent) toast("Falha ao salvar — alteração desfeita", "error");
    return false;
  }
}

async function deleteTask(id) {
  const before = clone(_tasks());
  boardStore.set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  try {
    await deleteTaskApi(id);
    toast("Post-it deletado", "success");
    return true;
  } catch {
    boardStore.set({ tasks: before });
    toast("Falha ao deletar post-it", "error");
    return false;
  }
}

async function toggleComplete(id) {
  const before = clone(_tasks());
  boardStore.set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === id ? { ...t, is_completed: !t.is_completed } : t
    ),
  }));
  try {
    const { data } = await toggleTask(id);
    boardStore.set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? data : t)),
    }));
  } catch {
    boardStore.set({ tasks: before });
    toast("Falha ao atualizar", "error");
  }
}

function toggleHighlight(id) {
  const t = _tasks().find((x) => x.id === id);
  if (!t) return;
  updateTask(id, { is_highlighted: !t.is_highlighted }, { silent: true });
}

// Reordena + move entre colunas. newOrderIds = ids da coluna de destino, em ordem.
async function moveTask(taskId, toCategory, newOrderIds) {
  const before = clone(_tasks());
  boardStore.set((s) => {
    const tasks = s.tasks.map((t) =>
      t.id === taskId ? { ...t, category: toCategory } : t
    );
    newOrderIds.forEach((id, i) => {
      const t = tasks.find((x) => x.id === id);
      if (t) t.display_order = i;
    });
    return { tasks };
  });
  try {
    await Promise.all(
      newOrderIds.map((id, i) => {
        const payload = { display_order: i };
        if (id === taskId) payload.category = toCategory;
        return updateTaskApi(id, payload);
      })
    );
    return true;
  } catch {
    boardStore.set({ tasks: before });
    toast("Falha ao mover post-it", "error");
    return false;
  }
}

// ---- categorias ----
async function addCategory(name) {
  try {
    const { data: cat } = await createCategory({
      name: name || "Nova categoria",
      default_color: DEFAULT_COLOR,
    });
    boardStore.set((s) => ({ categories: [...s.categories, cat] }));
    toast("Categoria criada", "success");
    return cat;
  } catch (error) {
    const detail = error.response && error.response.data;
    const msg = (detail && detail.name && detail.name[0]) || "Falha ao criar categoria";
    toast(msg, "error");
    return null;
  }
}

async function updateCategory(id, patch) {
  const before = clone(_cats());
  boardStore.set((s) => ({
    categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
  try {
    await updateCategoryApi(id, patch);
    return true;
  } catch (error) {
    boardStore.set({ categories: before });
    const detail = error.response && error.response.data;
    const msg = (detail && detail.name && detail.name[0]) || "Falha ao atualizar categoria";
    toast(msg, "error");
    return false;
  }
}

async function deleteCategory(id) {
  const beforeCats = clone(_cats());
  const beforeTasks = clone(_tasks());
  boardStore.set((s) => ({
    categories: s.categories.filter((c) => c.id !== id),
    tasks: s.tasks.map((t) => (t.category === id ? { ...t, category: null } : t)),
  }));
  try {
    await deleteCategoryApi(id);
    toast("Categoria deletada — post-its ficaram sem categoria", "success");
    return true;
  } catch {
    boardStore.set({ categories: beforeCats, tasks: beforeTasks });
    toast("Falha ao deletar categoria", "error");
    return false;
  }
}

async function applyColumnColorToAll(catId, color) {
  const before = clone(_tasks());
  const ids = _tasks().filter((t) => t.category === catId).map((t) => t.id);
  boardStore.set((s) => ({
    tasks: s.tasks.map((t) => (t.category === catId ? { ...t, color } : t)),
  }));
  try {
    await Promise.all(ids.map((id) => updateTaskApi(id, { color })));
    toast("Cor aplicada a todos os post-its da coluna", "success");
    return true;
  } catch {
    boardStore.set({ tasks: before });
    toast("Falha ao aplicar cor", "error");
    return false;
  }
}

// ---- compartilhamentos ----
function upsertShare(shares, share) {
  const exists = shares.some((sh) => sh.shared_with === share.shared_with);
  return exists
    ? shares.map((sh) => (sh.shared_with === share.shared_with ? share : sh))
    : [...shares, share];
}

async function addShare(taskId, username, permission) {
  try {
    const { data: share } = await createShare(taskId, username, permission);
    boardStore.set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, shares: upsertShare(t.shares || [], share) } : t
      ),
    }));
    toast("Post-it compartilhado", "success");
    return share;
  } catch (error) {
    const detail = error.response && error.response.data;
    const msg =
      (detail && detail.detail) ||
      (detail && detail.username && detail.username[0]) ||
      "Falha ao compartilhar";
    toast(msg, "error");
    return null;
  }
}

// O backend faz update_or_create, então recompartilhar atualiza a permissão.
function updateSharePermission(taskId, username, permission) {
  return addShare(taskId, username, permission);
}

async function removeShare(taskId, shareId) {
  const before = clone(_tasks());
  boardStore.set((s) => ({
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, shares: (t.shares || []).filter((sh) => sh.id !== shareId) }
        : t
    ),
  }));
  try {
    await revokeShare(taskId, shareId);
    toast("Compartilhamento removido", "success");
    return true;
  } catch {
    boardStore.set({ tasks: before });
    toast("Falha ao remover compartilhamento", "error");
    return false;
  }
}

// Objeto agregador, espelhando o uso anterior (S.fetchAll, S.addTask, ...).
const S = {
  useStore,
  THEMES,
  themeStore,
  setTheme,
  authStore,
  login,
  register,
  logout,
  boardStore,
  fetchAll,
  addTask,
  updateTask,
  deleteTask,
  toggleComplete,
  toggleHighlight,
  moveTask,
  addCategory,
  updateCategory,
  deleteCategory,
  applyColumnColorToAll,
  addShare,
  updateSharePermission,
  removeShare,
  toastStore,
  toast,
};

export default S;
