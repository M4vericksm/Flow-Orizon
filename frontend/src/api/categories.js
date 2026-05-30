import { api, getAllPages } from "./client.js";

export const listCategories = () => getAllPages("/categories/");

export const createCategory = (payload) => api.post("/categories/", payload);

export const updateCategory = (id, payload) =>
  api.patch(`/categories/${id}/`, payload);

export const deleteCategory = (id) => api.delete(`/categories/${id}/`);
