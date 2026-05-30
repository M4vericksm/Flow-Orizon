import { api } from "./client.js";

export const listShares = (taskId) => api.get(`/tasks/${taskId}/shares/`);

// O backend usa update_or_create, então criar novamente com outra permissão
// atualiza o compartilhamento existente.
export const createShare = (taskId, username, permission) =>
  api.post(`/tasks/${taskId}/shares/`, { username, permission });

export const revokeShare = (taskId, shareId) =>
  api.delete(`/tasks/${taskId}/shares/${shareId}/`);
