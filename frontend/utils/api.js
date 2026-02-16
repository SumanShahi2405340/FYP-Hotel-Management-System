// frontend/utils/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",   // Django backend
  headers: { "Content-Type": "application/json" },
  withCredentials: true               // important for Django session cookies
});

// Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors and refresh token automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven’t retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
            
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem("authToken", newAccessToken);

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Optionally redirect to login
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
