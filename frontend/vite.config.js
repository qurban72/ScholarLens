import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // Read .env from either current dir (frontend) or parent dir (root)
  envDir: path.resolve(__dirname, "."),
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:8000" },
  },
});
