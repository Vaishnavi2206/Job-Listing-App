import axios from "axios";
import {
  clearSessionActivity,
  isSessionIdleExpired,
} from "../utils/authSession";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && isSessionIdleExpired()) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearSessionActivity();
    window.dispatchEvent(new Event("auth:session-expired"));

    return config;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (isSessionIdleExpired()) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearSessionActivity();
      window.dispatchEvent(new Event("auth:session-expired"));

      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url === "/auth/refresh"
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await refreshClient.post(
        "/auth/refresh"
      );
      const { accessToken, user } = response.data;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(
        new CustomEvent("auth:session-refreshed", {
          detail: { accessToken, user },
        }),
      );
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearSessionActivity();
      window.dispatchEvent(new Event("auth:session-expired"));

      return Promise.reject(refreshError);
    }
  },
);

export default api;
