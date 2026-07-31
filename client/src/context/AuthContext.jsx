import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem("token"));

    // Configure axios defaults and fetch user
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                localStorage.setItem("token", token);
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
                    setUser(response.data);
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    // If 401, clear token
                    if (error.response && error.response.status === 401) {
                        logout();
                    }
                }
            } else {
                delete axios.defaults.headers.common["Authorization"];
                localStorage.removeItem("token");
                setUser(null);
            }
            setLoading(false);
        };

        initAuth();
    }, [token]);

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    const login = async (email, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append("username", email);
            formData.append("password", password);

            const response = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            setToken(response.data.access_token);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            const detailMsg = error.response?.data?.detail || (error.message === "Network Error" ? "Network or CORS error connecting to backend API." : "Login failed");
            return { success: false, error: detailMsg };
        }
    };

    const googleLogin = async (credential) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/google`, {
                credential
            });
            setToken(response.data.access_token);
            return { success: true };
        } catch (error) {
            console.error("Google login failed", error);
            return { success: false, error: error.response?.data?.detail || "Google login failed" };
        }
    };

    const register = async (email, password) => {
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, {
                email,
                password
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || "Registration failed" };
        }
    };

    const reloadUser = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
            setUser(response.data);
        } catch (error) {
            console.error("Failed to reload user profile", error);
        }
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, googleLogin, register, logout, loading, token, updateUser, reloadUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
