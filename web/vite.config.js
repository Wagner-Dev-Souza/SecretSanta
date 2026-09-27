import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento o front roda no host (npm run dev) e a API pode estar no
// container. VITE_DEV_API_TARGET aponta para onde ela estiver.
const alvoApi = process.env.VITE_DEV_API_TARGET || "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // o front sempre chama /api/... ; em dev quem tira o prefixo é este proxy
      "/api": {
        target: alvoApi,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
