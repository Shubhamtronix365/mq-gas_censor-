import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import LayoutWrapper from "../layouts/LayoutWrapper";
import { motion } from "framer-motion";
import { UserPlus, User, Lock, Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await register(email, password);
            if (result.success) {
                navigate("/login");
            } else {
                setError(result.error || "Registration failed. Please try again.");
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
                    {/* Decorative background elements */}
                    <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-gradient-to-bl from-emerald-500/10 via-transparent to-violet-600/10 pointer-events-none" />

                    <div className="text-center mb-8 relative z-10">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                        >
                            <UserPlus size={32} className="text-emerald-400" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
                        <p className="text-slate-400 text-sm">Join the Indianiiot IoT Ecosystem</p>
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

                    <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    className="neo-input pl-11 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="neo-input pl-11 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <CheckCircle2 size={18} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="neo-input pl-11 focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full neo-btn bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center text-sm relative z-10">
                        <p className="text-slate-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors hover:underline decoration-emerald-500/30 underline-offset-4">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </LayoutWrapper>
    );
};

export default Register;
