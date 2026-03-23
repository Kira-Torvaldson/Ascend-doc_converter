import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/public": {
        target: "http://localhost:3003",
        changeOrigin: true,
      },
    },
  },
});


