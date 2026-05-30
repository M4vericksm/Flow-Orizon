import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O host 0.0.0.0 permite acessar o dev server de dentro do container Docker.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
