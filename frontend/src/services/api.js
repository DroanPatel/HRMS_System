import axios from "axios";

// NOTE: use "localhost", NOT "127.0.0.1". The React app runs on localhost:5173,
// and browsers treat localhost and 127.0.0.1 as different sites, so a SameSite=Lax
// session cookie would not be sent to 127.0.0.1:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  withCredentials: true, // lets the browser send the Django session cookie
  headers: { "Content-Type": "application/json" },
});

const getCookie = (name) => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const SAFE_METHODS = ["get", "head", "options"];

// Django requires the CSRF token on every logged-in POST/PATCH/PUT/DELETE.
// Read it fresh each time: Django rotates it on login.
api.interceptors.request.use((config) => {
  if (!SAFE_METHODS.includes((config.method || "get").toLowerCase())) {
    const token = getCookie("csrftoken");
    if (token) config.headers["X-CSRFToken"] = token;
  }
  return config;
});

// SessionAuthentication answers "not logged in" with 403 (not 401), so treat both
// as "session expired" when the message says credentials are missing.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = String(error.response?.data?.detail || "");
    const url = error.config?.url || "";
    const isAuthCheck = url.includes("/auth/login") || url.includes("/auth/me");

    if (
      !isAuthCheck &&
      (status === 401 || (status === 403 && detail.includes("Authentication credentials")))
    ) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

export default api;
