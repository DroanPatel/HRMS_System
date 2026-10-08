import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,                      // listen on 0.0.0.0 inside Docker
    watch: { usePolling: true },     // hot reload works on Windows bind mounts
  },
});
