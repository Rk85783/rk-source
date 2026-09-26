import axios from "axios";

export const TOKEN_KEY = "rk-source.token";

export const readToken = () => localStorage.getItem(TOKEN_KEY);

export const writeToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  console.error(
    "[rk-source] VITE_API_URL is not set. Copy frontend/.env.example to " +
      "frontend/.env and point it at the API, or every request will fail.",
  );
}

// The token lives in localStorage, so any script that runs on this page can
// read it. That is the trade-off for not needing a cookie-based session; the
// backend still validates every request, but a stricter deployment should
// move this to an httpOnly cookie.
export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((cfg) => {
  const token = readToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// A rejected token means the session is gone, whatever the screen was doing.
// Clearing here stops every later request from replaying a dead token.
let onUnauthorized = null;

export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
  return () => {
    if (onUnauthorized === fn) onUnauthorized = null;
  };
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && readToken()) {
      clearToken();
      onUnauthorized?.();
    }
    return Promise.reject(err);
  },
);

// The API returns every field problem in `errors`, and a plain `message` for
// everything else. Forms want the first thing a person can act on.
const firstError = (err) => {
  const [first] = err.response?.data?.errors ?? [];
  return (
    first?.message ||
    err.response?.data?.message ||
    "Something went wrong. Try again."
  );
};

export const getHealth = () => api.get("/api/health");

export const register = (payload) => api.post("/api/auth/register", payload);

export const login = (payload) => api.post("/api/auth/login", payload);

export const me = () => api.get("/api/auth/me");

export { firstError };
