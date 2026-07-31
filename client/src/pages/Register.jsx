import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
);

const Register = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleCustomGoogleClick = () => {
        if (window.google) {
            window.google.accounts.id.prompt();
        } else {
            setError("Google Sign-In service is initializing. Please try again in a moment.");
        }
    };

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

        if (!agreeTerms) {
            setError("Please agree to the Terms of Service & Privacy Policy.");
            return;
        }

        setIsLoading(true);
        try {
            const result = await register(email, password, fullName);
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
        <div className="relative min-h-screen w-full bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat flex items-center justify-center lg:justify-end lg:pr-24 px-4 py-8 overflow-hidden font-sans">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-slate-950/30 backdrop-brightness-95 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 w-full max-w-[440px]"
            >
                {/* Main Glassmorphic Container matching LOGIN COMPONENT.png */}
                <div className="bg-[#071320]/85 backdrop-blur-xl border border-[#1e3a5f]/60 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-left">

                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
                            Create Account
                        </h1>
                        <p className="text-[#8a99ad] text-sm">
                            Sign up for your IIoT workspace account
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {/* Full Name Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <User size={18} className="text-[#64748b] group-focus-within:text-[#0070f3] transition-colors" />
                            </div>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Full name"
                                className="w-full bg-[#0b1b2d] border border-[#1b2f48] text-white placeholder:text-[#475569] rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] transition-all"
                            />
                        </div>

                        {/* Email Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Mail size={18} className="text-[#64748b] group-focus-within:text-[#0070f3] transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full bg-[#0b1b2d] border border-[#1b2f48] text-white placeholder:text-[#475569] rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] transition-all"
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock size={18} className="text-[#64748b] group-focus-within:text-[#0070f3] transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-[#0b1b2d] border border-[#1b2f48] text-white placeholder:text-[#475569] rounded-xl pl-11 pr-11 py-3 text-sm outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748b] hover:text-slate-200 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Confirm Password Input */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock size={18} className="text-[#64748b] group-focus-within:text-[#0070f3] transition-colors" />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                className="w-full bg-[#0b1b2d] border border-[#1b2f48] text-white placeholder:text-[#475569] rounded-xl pl-11 pr-11 py-3 text-sm outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748b] hover:text-slate-200 transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-center pt-1 pb-1 text-sm">
                            <label className="flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="w-4 h-4 rounded border-[#1b2f48] bg-[#0b1b2d] text-[#0070f3] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0070f3]"
                                />
                                <span className="ml-2.5 text-[#94a3b8] text-xs">
                                    I agree to the <a href="#terms" className="text-[#0091ff] hover:underline">Terms of Service</a> & <a href="#privacy" className="text-[#0091ff] hover:underline">Privacy Policy</a>
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#0070f3] hover:bg-[#0060df] text-white font-medium py-3 rounded-xl shadow-[0_4px_20px_rgba(0,112,243,0.35)] transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-base disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center my-5">
                        <div className="border-t border-[#1c304a] flex-1" />
                        <span className="px-4 text-xs font-semibold text-[#475569] uppercase tracking-wider">OR</span>
                        <div className="border-t border-[#1c304a] flex-1" />
                    </div>

                    {/* OAuth Button - Google Only (No Microsoft as requested) */}
                    <button
                        type="button"
                        onClick={handleCustomGoogleClick}
                        className="w-full bg-[#0b1b2d] hover:bg-[#0f233a] border border-[#1b2f48] py-3 px-4 rounded-xl flex items-center justify-center gap-3 text-slate-200 text-sm font-medium transition-all active:scale-[0.99] cursor-pointer"
                    >
                        <GoogleIcon />
                        <span>Sign up with Google</span>
                    </button>

                    {/* Footer Toggle Link */}
                    <div className="mt-6 text-center text-sm text-[#8a99ad]">
                        Already have an account?{" "}
                        <Link to="/login" className="text-[#0091ff] font-semibold hover:underline transition-colors ml-0.5">
                            Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
