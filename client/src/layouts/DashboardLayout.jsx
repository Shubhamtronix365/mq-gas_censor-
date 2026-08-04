import { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { 
    LogOut, LayoutDashboard, Server, User, Menu, X, Zap, ChevronDown, Bell, Settings, 
    CreditCard, Cloud, Search, Award, Activity, BarChart2, ShieldAlert, Sliders,
    Command, ArrowRight, CheckCircle2, AlertTriangle, Sparkles
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "./LayoutWrapper";

const APP_PAGES = [
    { title: "Dashboard Overview", path: "/", type: "page", icon: LayoutDashboard, desc: "Main telemetry & KPI overview" },
    { title: "All Devices & Nodes", path: "/devices", type: "page", icon: Server, desc: "Manage all deployed node instances" },
    { title: "Analytics & Reports", path: "/analytics", type: "page", icon: BarChart2, desc: "System performance, charts & metrics" },
    { title: "User Profile & Settings", path: "/profile", type: "page", icon: User, desc: "Account settings & preference options" },
    { title: "Subscription & Billing", path: "/subscription", type: "page", icon: CreditCard, desc: "Manage plan limits and billing" },
    { title: "Gas Sensor Monitor", path: "/devices?search=gas_sensor", type: "page", icon: Zap, desc: "Gas concentration & safety node" },
    { title: "Air Quality Monitor", path: "/devices?search=air_quality_monitor", type: "page", icon: Activity, desc: "AQI & environmental sensor node" },
    { title: "Light / LDR Sensor", path: "/devices?search=ldr_sensor", type: "page", icon: Sliders, desc: "Ambient illuminance & light node" },
    { title: "Energy Meter Node", path: "/devices?search=energy_meter", type: "page", icon: ShieldAlert, desc: "Electrical load & power monitor" },
];

const QUICK_ACTIONS = [
    { title: "Deploy New Sensor Node", path: "/devices", action: "deploy", icon: Zap, desc: "Add a new node to your fleet" },
    { title: "Upgrade Subscription Plan", path: "/subscription", action: "upgrade", icon: Award, desc: "Unlock higher node limits" },
    { title: "Configure Profile Settings", path: "/profile", action: "profile", icon: Settings, desc: "Update user profile & credentials" },
];

const DashboardLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [deviceCount, setDeviceCount] = useState(0);
    const [deviceLimit, setDeviceLimit] = useState(15);
    const [userDevices, setUserDevices] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    const searchInputRef = useRef(null);
    const mobileSearchInputRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Sync search input with URL search param if on devices page
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const queryParam = searchParams.get("search");
        if (location.pathname === "/devices" && queryParam !== null) {
            setSearchQuery(queryParam);
        }
    }, [location.pathname, location.search]);

    // Fetch plan usage & user devices
    useEffect(() => {
        const fetchPlanAndDevices = async () => {
            try {
                const [limitRes, devRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/limit-info`).catch(() => null),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`).catch(() => null)
                ]);

                if (limitRes?.data) {
                    setDeviceCount(limitRes.data.used ?? 0);
                    setDeviceLimit(limitRes.data.limit ?? 15);
                }
                if (devRes?.data) {
                    setUserDevices(devRes.data || []);
                    if (!limitRes?.data) {
                        setDeviceCount(devRes.data.length ?? 0);
                    }
                }
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            }
        };
        fetchPlanAndDevices();
    }, [location.pathname]);

    // Keyboard shortcut Ctrl+K / Cmd+K listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                if (mobileSearchOpen) {
                    mobileSearchInputRef.current?.focus();
                } else {
                    searchInputRef.current?.focus();
                }
                setIsSearchFocused(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mobileSearchOpen]);

    // Outside click dismissal
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter search results dynamically
    const q = searchQuery.trim().toLowerCase();

    const filteredDevices = q
        ? userDevices.filter(d => 
            d.device_id.toLowerCase().includes(q) ||
            (d.device_type && d.device_type.toLowerCase().includes(q)) ||
            (d.device_type === 'gas_sensor' && 'gas node'.includes(q)) ||
            (d.device_type === 'ldr_sensor' && 'light node'.includes(q)) ||
            (d.device_type === 'air_quality_monitor' && 'air quality node'.includes(q)) ||
            (d.device_type === 'combined_sensor' && 'fusion node'.includes(q)) ||
            (d.device_type === 'energy_meter' && 'energy meter power'.includes(q))
          )
        : userDevices.slice(0, 4);

    const filteredPages = q
        ? APP_PAGES.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
        : APP_PAGES.slice(0, 4);

    const filteredActions = q
        ? QUICK_ACTIONS.filter(a => a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))
        : QUICK_ACTIONS;

    // Combined flat list of visible search items for arrow key navigation
    const allSearchItems = [
        ...filteredDevices.map(d => ({
            id: `dev-${d.device_id}`,
            category: "Devices & Nodes",
            title: d.device_type === 'ldr_sensor' ? 'LightNode' :
                   d.device_type === 'combined_sensor' ? 'FusionNode' :
                   d.device_type === 'air_quality_monitor' ? 'AirQualityNode' :
                   d.device_type === 'energy_meter' ? 'Energy Meter' : 'GasNode',
            subtitle: `ID: ${d.device_id} • ${d.is_online ? 'ONLINE' : 'OFFLINE'}`,
            icon: Server,
            isOnline: d.is_online,
            onSelect: () => navigate(`/devices/${d.device_id}`)
        })),
        ...filteredPages.map(p => ({
            id: `page-${p.path}`,
            category: "Pages & Dashboards",
            title: p.title,
            subtitle: p.desc,
            icon: p.icon,
            onSelect: () => navigate(p.path)
        })),
        ...filteredActions.map(a => ({
            id: `act-${a.title}`,
            category: "Quick Actions",
            title: a.title,
            subtitle: a.desc,
            icon: a.icon,
            onSelect: () => navigate(a.path)
        }))
    ];

    // Reset selected index when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setIsSearchFocused(false);
        setMobileSearchOpen(false);

        if (allSearchItems.length > 0 && selectedIndex < allSearchItems.length) {
            allSearchItems[selectedIndex].onSelect();
        } else if (searchQuery.trim()) {
            navigate(`/devices?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/devices');
        }
    };

    const handleKeyDownInInput = (e) => {
        if (!allSearchItems.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % allSearchItems.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + allSearchItems.length) % allSearchItems.length);
        } else if (e.key === "Escape") {
            setIsSearchFocused(false);
            setMobileSearchOpen(false);
            searchInputRef.current?.blur();
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                onClick={() => setMobileMenuOpen(false)}
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
            </Link>
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
                    <button
                        onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 border border-white/5"
                        aria-label="Toggle Mobile Search"
                    >
                        <Search size={18} />
                    </button>
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

            {/* Mobile Search Overlay Bar */}
            <AnimatePresence>
                {mobileSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="md:hidden fixed top-16 inset-x-0 z-30 p-3 bg-[#080d1a] border-b border-white/10 shadow-2xl"
                    >
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={mobileSearchInputRef}
                                type="text"
                                placeholder="Search nodes, pages, or metrics..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDownInInput}
                                autoFocus
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-blue-500/40 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

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
                
                {/* Desktop Top Header Bar */}
                <header className="hidden md:flex h-20 items-center justify-between px-8 border-b border-white/5 bg-[#030712]/60 backdrop-blur-md sticky top-0 z-30">
                    
                    {/* Interactive Command Search Bar Component */}
                    <div ref={searchContainerRef} className="relative w-96">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search nodes, pages, metrics... (Ctrl+K)"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onKeyDown={handleKeyDownInInput}
                                className={clsx(
                                    "w-full pl-10 pr-16 py-2 bg-slate-900/80 border rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all",
                                    isSearchFocused ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] bg-slate-900" : "border-white/10 hover:border-white/20"
                                )}
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                                >
                                    <X size={13} />
                                </button>
                            ) : (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none font-mono">
                                    <span>Ctrl</span>
                                    <span>K</span>
                                </div>
                            )}
                        </form>

                        {/* Live Auto-suggest Dropdown */}
                        <AnimatePresence>
                            {isSearchFocused && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 top-full mt-2 bg-[#080d1a]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[460px] overflow-y-auto divide-y divide-white/5"
                                >
                                    {allSearchItems.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400">
                                            <AlertTriangle size={24} className="mx-auto text-amber-400/80 mb-2" />
                                            <p className="text-xs font-bold text-slate-300">No matching results found</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Try searching for 'gas', 'ldr', 'air', 'analytics', or 'profile'</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Render by Category */}
                                            {["Devices & Nodes", "Pages & Dashboards", "Quick Actions"].map((categoryName) => {
                                                const itemsInCategory = allSearchItems.filter(item => item.category === categoryName);
                                                if (itemsInCategory.length === 0) return null;

                                                return (
                                                    <div key={categoryName} className="p-2">
                                                        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-400/80 flex items-center justify-between">
                                                            <span>{categoryName}</span>
                                                            <span className="text-slate-500 font-mono font-normal">{itemsInCategory.length}</span>
                                                        </div>
                                                        <div className="space-y-1 mt-0.5">
                                                            {itemsInCategory.map((item) => {
                                                                const globalIdx = allSearchItems.findIndex(i => i.id === item.id);
                                                                const isSelected = globalIdx === selectedIndex;
                                                                const ItemIcon = item.icon;

                                                                return (
                                                                    <div
                                                                        key={item.id}
                                                                        onClick={() => {
                                                                            item.onSelect();
                                                                            setIsSearchFocused(false);
                                                                        }}
                                                                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                                        className={clsx(
                                                                            "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all",
                                                                            isSelected ? "bg-blue-600/20 border border-blue-500/40 text-white" : "hover:bg-white/5 text-slate-300"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div className={clsx(
                                                                                "p-2 rounded-lg shrink-0",
                                                                                isSelected ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-400"
                                                                            )}>
                                                                                <ItemIcon size={16} />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div className="flex items-center gap-2">
                                                                                    <p className="text-xs font-bold truncate text-white">{item.title}</p>
                                                                                    {item.isOnline !== undefined && (
                                                                                        <span className={clsx(
                                                                                            "w-2 h-2 rounded-full",
                                                                                            item.isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-600"
                                                                                        )} />
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                                                                            </div>
                                                                        </div>
                                                                        <ArrowRight size={14} className={clsx("shrink-0 ml-2 transition-transform", isSelected ? "text-blue-400 translate-x-0.5" : "text-transparent")} />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* Footer helper */}
                                            <div className="p-2.5 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                                <span>Use <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">↑</kbd> <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">↓</kbd> to navigate</span>
                                                <span>Press <kbd className="px-1 py-0.5 bg-white/10 rounded text-slate-300">Enter</kbd> to select</span>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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

