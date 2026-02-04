import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
                    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`);
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
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
                username: email,
                password: password
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            setToken(response.data.access_token);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, error: error.response?.data?.detail || "Login failed" };
        }
    };

    const register = async (email, password) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
                email,
                password
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || "Registration failed" };
        }
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, token, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
