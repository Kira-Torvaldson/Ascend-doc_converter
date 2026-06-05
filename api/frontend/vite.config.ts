import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import javascriptObfuscator from "vite-plugin-javascript-obfuscator";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Production-only obfuscation (do not slow down dev).
    ...(mode === "production"
      ? [
          javascriptObfuscator({
            compact: true,
            controlFlowFlattening: true,
            deadCodeInjection: true,
            stringArrayThreshold: 0.75,
            // Intentionally NOT enabling debugProtection (anti-debug infinite loop).
          }),
        ]
      : []),
  ],
  server: {
    port: 5173,
    proxy: {
      "/public": {
        target: "http://localhost:3003",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    // Remove console noise in production bundles.
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove common console methods while keeping console.error for troubleshooting.
        pure_funcs: ["console.log", "console.debug", "console.info"],
      },
    },
  },
}));


