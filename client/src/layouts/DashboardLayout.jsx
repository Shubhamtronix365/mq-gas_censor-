import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { 
    LogOut, LayoutDashboard, Server, User, Menu, X, Zap, ChevronDown, Bell, Settings, 
    CreditCard, Cloud, Search, Award, Activity, BarChart2, ShieldAlert, Sliders
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "./LayoutWrapper";

const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [deviceCount, setDeviceCount] = useState(0);
    const [deviceLimit, setDeviceLimit] = useState(15);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchPlanUsage = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/limit-info`);
                setDeviceCount(res.data.used ?? 0);
                setDeviceLimit(res.data.limit ?? 15);
            } catch (err) {
                // Fallback device count
                try {
                    const devRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
                    setDeviceCount(devRes.data?.length ?? 0);
                } catch (e) {
                    console.error("Plan usage fetch error", e);
                }
            }
        };
        fetchPlanUsage();
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/devices?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/devices');
        }
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
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full relative overflow-hidden group cursor-pointer",
                    isActive ? "text-white bg-blue-600/20 border-l-4 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
            >
                {isActive && (
                    <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-blue-600/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
                <Icon size={19} className={clsx("relative z-10", isActive ? "text-blue-400" : "group-hover:text-blue-400 transition-colors")} />
                <span className="relative z-10 font-semibold text-sm tracking-wide">{label}</span>
            </button>
        );
    };

    const UserDropdown = () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20 border border-white/10">
                        {user?.full_name?.charAt(0) || "A"}
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-bold text-white leading-none">{user?.full_name || "Admin"}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Admin</p>
                    </div>
                    <ChevronDown className="text-slate-400" size={14} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#080d1a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 z-[100]"
                        >
                            <div className="px-3 py-2 border-b border-white/5 mb-1">
                                <p className="text-xs font-bold text-white truncate">{user?.full_name || "Admin User"}</p>
                                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigate("/profile");
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
                            >
                                <User size={15} />
                                Profile Settings
                            </button>
                            <button
                                onClick={() => {
                                    navigate("/subscription");
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
                            >
                                <Zap size={15} />
                                Subscription Plan
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-xs font-semibold"
                            >
                                <LogOut size={15} />
                                Sign Out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const planDisplay = (user?.subscription_plan || "Professional").toUpperCase();
    const usedPct = Math.min(100, Math.round((deviceCount / (deviceLimit || 15)) * 100));

    return (
        <LayoutWrapper className="flex h-screen bg-[#030712] overflow-hidden">
            {/* Mobile Header Bar */}
            <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#030712]/95 backdrop-blur-md border-b border-white/10 p-3 px-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Cloud className="text-blue-500 shrink-0" size={22} />
                    <span className="text-lg font-black tracking-tight text-white flex items-baseline truncate">
                        Indian<span className="text-blue-400">IIoT</span> 
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold ml-1.5 hidden xs:inline">by TRONIX365</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <UserDropdown />
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/5"
                        aria-label="Toggle Navigation Menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Backdrop Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Left Desktop & Mobile Sidebar matching Dashboard.png */}
            <AnimatePresence mode="wait">
                {(mobileMenuOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className={clsx(
                            "fixed inset-y-0 left-0 z-50 w-72 bg-[#060a17]/95 backdrop-blur-2xl border-r border-white/5 flex flex-col justify-between md:relative shadow-2xl md:shadow-none select-none",
                            !mobileMenuOpen && "hidden md:flex"
                        )}
                    >
                        {/* Sidebar Header Logo matching Dashboard.png */}
                        <div className="p-6 pb-4 pt-7 hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                                    <Cloud className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-xl font-black tracking-tight text-white flex items-center">
                                        Indian<span className="text-blue-400">IIoT</span>
                                    </h1>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">
                                        • Mission Control <span className="text-blue-400">TRONIX365</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Sidebar Header */}
                        <div className="p-6 md:hidden flex justify-between items-center border-b border-white/5 pt-16">
                            <div className="flex items-center gap-2">
                                <Cloud className="text-blue-400" size={20} />
                                <span className="text-lg font-bold text-white">Navigation Menu</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Navigation Links matching Dashboard.png */}
                        <nav className="flex-1 px-4 space-y-1.5 mt-4 md:mt-2">
                            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem to="/devices" icon={Server} label="Devices" />
                            <NavItem to="/analytics" icon={BarChart2} label="Analytics" />
                            <NavItem to="/profile" icon={User} label="Profile" />
                            <NavItem to="/subscription" icon={CreditCard} label="Subscription" />
                        </nav>

                        {/* Bottom Plan Card Widget matching Dashboard.png */}
                        <div className="p-4 m-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/20 shadow-xl relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan</span>
                                    <div className="text-sm font-black text-blue-400 tracking-wide mt-0.5">{planDisplay}</div>
                                </div>
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                                    <Award size={18} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1.5">
                                <span className="text-[10px] text-slate-400">Devices Used</span>
                                <span className="font-mono text-white">{deviceCount} / {deviceLimit}</span>
                            </div>
                            {/* Fill Progress Bar */}
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" 
                                    style={{ width: `${usedPct}%` }}
                                ></div>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Center & Right Container */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
                
                {/* Desktop Top Header Bar matching Dashboard.png */}
                <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-white/5 bg-[#030712]/60 backdrop-blur-md sticky top-0 z-30">
                    
                    {/* Search Bar Input */}
                    <form onSubmit={handleSearchSubmit} className="relative w-80">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search devices..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition-all"
                        />
                    </form>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <button className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition-colors relative cursor-pointer" title="Notifications">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        </button>

                        {/* User Profile Badge */}
                        <UserDropdown />
                    </div>
                </header>

                {/* Main View Scroll Area */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-[1920px] mx-auto p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
                        <Outlet />
                    </div>
                </div>
            </main>
        </LayoutWrapper>
    );
};

export default DashboardLayout;
