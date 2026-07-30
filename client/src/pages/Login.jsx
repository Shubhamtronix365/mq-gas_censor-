import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import LayoutWrapper from "../layouts/LayoutWrapper";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Loader2 } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const initGoogle = () => {
            if (window.google) {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "68725838549-mockupclientid.apps.googleusercontent.com";
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleResponse,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("google-signin-btn"),
                    { theme: "dark", size: "large", width: 320, text: "continue_with" }
                );
            }
        };

        const interval = setInterval(() => {
            if (window.google) {
                initGoogle();
                clearInterval(interval);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const handleGoogleResponse = async (response) => {
        setIsLoading(true);
        setError("");
        try {
            const result = await googleLogin(response.credential);
            if (result.success) {
                navigate("/");
            } else {
                setError(result.error || "Google sign-in failed.");
            }
        } catch (err) {
            setError("Google sign-in error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(""); // Clear previous errors

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate("/");
            } else {
                setError(result.error || "Login failed. Please check your credentials.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LayoutWrapper className="flex items-center justify-center min-h-screen px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <div className="neo-card p-8 sm:p-10 relative overflow-hidden">
                    {/* Decorative glow behind the card content */}
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-violet-600/10 via-transparent to-emerald-500/10 pointer-events-none" />

                    <div className="text-center mb-8 relative z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                        >
                            <User size={32} className="text-violet-400" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-400 text-sm">Sign in to access your IoT Control Center</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="neo-input pl-11"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="neo-input pl-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full neo-btn-primary py-3.5 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="relative my-6 z-10 flex items-center justify-center">
                        <div className="border-t border-white/10 w-full"></div>
                        <span className="bg-[#020617] px-3 text-slate-500 text-xs font-bold uppercase tracking-wider shrink-0">Or</span>
                        <div className="border-t border-white/10 w-full"></div>
                    </div>

                    <div className="relative z-10 flex justify-center">
                        <div id="google-signin-btn" className="w-full"></div>
                    </div>

                    <div className="mt-6 text-center text-sm relative z-10">
                        <p className="text-slate-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-violet-400 font-bold hover:text-violet-300 transition-colors hover:underline decoration-violet-500/30 underline-offset-4">
                                Create Access
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </LayoutWrapper>
    );
};

export default Login;
