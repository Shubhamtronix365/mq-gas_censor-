import axios from "axios";

// Determine the base API URL dynamically from Vite environment or default to Render backend
const rawApiUrl = import.meta.env.VITE_API_URL || "https://mq-gas-censor-sensegrid-api-tronix.onrender.com";

// Remove trailing slash if present
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

// Create pre-configured Axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request interceptor to attach JWT Authorization token automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
