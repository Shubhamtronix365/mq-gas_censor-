import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Server, User, Menu, X, Zap } from "lucide-react";
import { clsx } from 'clsx';
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "./LayoutWrapper";

const DashboardLayout = () => {
    const { logout } = useAuth();
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

    return (
        <LayoutWrapper className="flex h-screen">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
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
                            "fixed inset-y-0 left-0 z-40 w-72 bg-[#020617]/50 backdrop-blur-2xl border-r border-white/5 flex flex-col md:relative",
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
                            <NavItem to="/profile" icon={User} label="Profile" />
                        </nav>

                        <div className="p-6 border-t border-white/5">
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl w-full transition-all group"
                            >
                                <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-auto w-full relative z-0">
                <div className="max-w-[1920px] mx-auto p-4 md:p-8 pt-24 md:pt-8 min-h-screen">
                    <Outlet />
                </div>
            </main>
        </LayoutWrapper>
    );
};

export default DashboardLayout;
