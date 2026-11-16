import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api calls go to the Express backend so the browser sees one origin,
// matching NGINX in Docker and the Ingress in Kubernetes. Override the target with
// VITE_API_PROXY_TARGET if the backend runs somewhere else.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_API_PROXY_TARGET || "http://localhost:3000",
    },
  },
});
