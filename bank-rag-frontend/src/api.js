import axios from "axios";

// Helper to read cookie by name
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
      c = c.trim();
      if (c.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(c.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true,
});

// Add a request interceptor to add CSRF token header
api.interceptors.request.use(
  (config) => {
    // Only add CSRF token to unsafe methods (state-changing)
    const safeMethods = ["GET", "HEAD", "OPTIONS", "TRACE"];
    if (!safeMethods.includes(config.method.toUpperCase())) {
      const csrftoken = getCookie("csrftoken");
      if (csrftoken) {
        config.headers["X-CSRFToken"] = csrftoken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
