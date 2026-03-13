import axios from "axios";

const recepApi = axios.create({
  baseURL: "http://127.0.0.1:8000",   // Django backend
  headers: { "Content-Type": "application/json" },
  withCredentials: true               // important for Django session cookies
});

// Attach receptionist access token to every request
recepApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("recepToken"); //  use recepToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors and refresh receptionist token automatically
recepApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("recepRefreshToken"); //  use recepRefreshToken
      if (refreshToken) {
        try {
          const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem("recepToken", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return recepApi(originalRequest);
        } catch (refreshError) {
          console.error("Receptionist token refresh failed:", refreshError);
          // Clear tokens and redirect to login
          localStorage.removeItem("recepToken");
          localStorage.removeItem("recepRefreshToken");
          window.location.href = "/receptionist/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default recepApi;
