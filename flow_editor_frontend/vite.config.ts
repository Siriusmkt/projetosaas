import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/flow/", // Base path para servir os assets corretamente
  // Usar .env da raiz do projeto (onde costuma estar o .env com dados reais)
  envDir: path.resolve(__dirname, ".."),
  server: {
    host: "::",
    port: 5173, // Porta diferente do backend (8000)
    hmr: {
      overlay: false,
    },
    // Proxy /api para o backend (saas_server) para os blocos do flow carregarem no canvas
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/health": {
        target: process.env.VITE_API_URL || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
