import { api, getAllPages } from "./client.js";

export const listTasks = (params) => getAllPages("/tasks/", params);

export const createTask = (payload) => api.post("/tasks/", payload);

export const updateTask = (id, payload) => api.patch(`/tasks/${id}/`, payload);

export const deleteTask = (id) => api.delete(`/tasks/${id}/`);

export const toggleTask = (id) => api.post(`/tasks/${id}/toggle/`);
