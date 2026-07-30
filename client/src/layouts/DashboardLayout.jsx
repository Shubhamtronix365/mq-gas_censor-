import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Server, User, Menu, X, Zap, ChevronDown, Bell, Settings, CreditCard } from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "./LayoutWrapper";

const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <button
                onClick={() => {
                    navigate(to);
                    setMobileMenuOpen(false);
                }}
                className={clsx(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full relative overflow-hidden group",
                    isActive ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
                )}
            >
                {isActive && (
                    <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-violet-600/20 border-l-2 border-violet-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
                <Icon size={20} className={clsx("relative z-10", isActive ? "text-violet-400" : "group-hover:text-violet-400 transition-colors")} />
                <span className="relative z-10 font-medium">{label}</span>
            </button>
        )
    }

    const UserDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
                        {user?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-white leading-none">{user?.full_name || "User"}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Admin</p>
                    </div>
                    <Menu className="text-slate-400" size={16} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 shadow-2xl p-2 z-[100]" // Increased z-index
                        >
                            <div className="px-3 py-2 border-b border-white/5 mb-1">
                                <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigate("/profile");
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm"
                            >
                                <User size={16} />
                                Profile Settings
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/subscription");
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm"
                            >
                                <Zap size={16} />
                                Subscription
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-sm"
                            >
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <LayoutWrapper className="flex h-screen bg-[#020617] overflow-hidden">
            {/* Mobile Header - Kept for mobile toggle but simplified */}
            <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#020617]/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Zap className="text-violet-500" size={24} />
                    <span className="text-xl font-bold tracking-tight text-white">TRONIX<span className="font-light text-violet-400">365</span></span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 -mr-2 text-slate-400 hover:text-white rounded-lg"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {(mobileMenuOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={clsx(
                            "fixed inset-y-0 left-0 z-50 w-72 bg-[#020617]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col md:relative",
                            !mobileMenuOpen && "hidden md:flex"
                        )}
                    >
                        <div className="p-8 hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-600/20 rounded-lg border border-violet-500/30">
                                    <Zap className="text-violet-400" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-white">TRONIX<span className="text-violet-500">365</span></h1>
                                    <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase font-bold">Indianiiot</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Sidebar Header */}
                        <div className="p-6 md:hidden flex justify-between items-center border-b border-white/5 pt-20">
                            <h1 className="text-xl font-bold tracking-tight text-white">Menu</h1>
                        </div>

                        <nav className="flex-1 px-6 space-y-2 mt-8 md:mt-0">
                            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/devices" icon={Server} label="Devices" />
                            <NavItem to="/subscription" icon={CreditCard} label="Subscription" />
                            <NavItem to="/profile" icon={User} label="Profile" />
                        </nav>

                        <div className="p-6 border-t border-white/5">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-white/5 mb-4">
                                <h4 className="text-sm font-bold text-white mb-1 uppercase">{user?.subscription_plan || "Free Plan"}</h4>
                                <p className="text-xs text-slate-400 mb-3">
                                    {user?.subscription_status === 'active' ? "Your subscription is active." : "Upgrade to unlock metrics limits."}
                                </p>
                                <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-violet-500 rounded-full transition-all"
                                        style={{ width: user?.subscription_plan && user.subscription_plan !== "free" ? "100%" : "30%" }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
                {/* Desktop Top Bar */}
                <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-white/5 bg-[#020617]/50 backdrop-blur-sm sticky top-0 z-30">
                    <h2 className="text-xl font-semibold text-white">
                        {location.pathname === '/' ? 'Dashboard' :
                            location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
                    </h2>

                    <div className="flex items-center gap-4">
                        <UserDropdown />
                    </div>
                </header>

                <div className="flex-1 overflow-auto">
                    <div className="max-w-[1920px] mx-auto p-4 md:p-8 pt-24 md:pt-8 min-h-screen">
                        <Outlet />
                    </div>
                </div>
            </main>
        </LayoutWrapper>
    );
};

export default DashboardLayout;
