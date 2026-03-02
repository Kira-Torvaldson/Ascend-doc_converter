/**
 * Backend API base URL
 * - Dev: undefined → http://localhost:3003
 * - Docker: VITE_API_BASE="" → relative URLs, Nginx proxies to backend
 */
export const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : "http://localhost:3003";
