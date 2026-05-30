import { api } from "./client.js";

export const login = (username, password) =>
  api.post("/auth/login/", { username, password });

export const register = (payload) => api.post("/auth/register/", payload);

export const fetchMe = () => api.get("/auth/me/");
