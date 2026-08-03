import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Monitor, Activity, Bell, BarChart2, ChevronRight, Clock, ArrowUpRight, 
    Wifi, Droplets, Zap, Sun, Thermometer, ShieldCheck, Wind
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OnboardingModal from "../components/OnboardingModal";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { clsx } from "clsx";

const Dashboard = () => {
    const { user } = useAuth();
    const [devices, setDevices] = useState([]);
    const [stats, setStats] = useState({ total: 8, active: 6, offline: 1, warning: 1, uptime: "99.4%" });
    const [loading, setLoading] = useState(true);
    const [currentTimeStr, setCurrentTimeStr] = useState("");
    const [selectedMetric, setSelectedMetric] = useState("temperature");

    // Sample telemetry trend data matching Dashboard.png graph
    const trendData = [
        { time: "09:00", temperature: 22.0, gas: 320, aqi: 25, light: 1100, energy: 2.1 },
        { time: "09:15", temperature: 28.5, gas: 410, aqi: 32, light: 1250, energy: 2.8 },
        { time: "09:30", temperature: 25.0, gas: 380, aqi: 28, light: 1180, energy: 2.4 },
        { time: "09:45", temperature: 34.0, gas: 520, aqi: 42, light: 1400, energy: 3.2 },
        { time: "10:00", temperature: 31.0, gas: 480, aqi: 36, light: 1320, energy: 2.9 },
        { time: "10:15", temperature: 42.5, gas: 620, aqi: 54, light: 1550, energy: 3.9 },
        { time: "10:30", temperature: 35.0, gas: 510, aqi: 40, light: 1380, energy: 3.4 }
    ];

    useEffect(() => {
        fetchDevices();
    }, [user]);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • " + now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDevices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
            const fetched = response.data || [];
            setDevices(fetched);

            if (fetched.length > 0) {
                const activeCount = fetched.filter(d => d.is_online).length;
                const offlineCount = fetched.length - activeCount;
                setStats({
                    total: fetched.length,
                    active: activeCount,
                    offline: offlineCount,
                    warning: 1,
                    uptime: "99.4%"
                });
            }
        } catch (error) {
            console.error("Error fetching dashboard devices:", error);
        } finally {
            setLoading(false);
        }
    };

    const activePct = Math.round((stats.active / (stats.total || 1)) * 100);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const metricUnit = selectedMetric === "temperature" ? "°C" :
                               selectedMetric === "gas" ? "PPM" :
                               selectedMetric === "aqi" ? "AQI" :
                               selectedMetric === "light" ? "LUX" : "kW";
            return (
                <div className="bg-[#080d1a]/95 backdrop-blur-md p-3 rounded-xl border border-blue-500/30 shadow-2xl min-w-[130px] text-center">
                    <p className="text-[10px] text-slate-400 font-medium mb-1">{label}</p>
                    <p className="text-base font-black text-blue-400">{payload[0].value} <span className="text-xs text-slate-400 font-normal">{metricUnit}</span></p>
                </div>
            );
        }
        return null;
    };

    // Fallback sample cards for Recent Devices if user has created fewer than 4 nodes
    const sampleRecentNodes = [
        {
            device_id: "ESP32 - Node 01",
            device_type: "gas_sensor",
            location: "Factory A",
            value: "24.5 °C",
            is_online: true,
            icon: Wifi,
            colorHex: "#10b981"
        },
        {
            device_id: "Air Quality - 02",
            device_type: "air_quality_monitor",
            location: "Factory B",
            value: "AQI 38",
            is_online: true,
            icon: Droplets,
            colorHex: "#06b6d4"
        },
        {
            device_id: "Energy Meter - 01",
            device_type: "energy_meter",
            location: "Main Panel",
            value: "3.62 kW",
            is_online: true,
            icon: Zap,
            colorHex: "#a855f7"
        },
        {
            device_id: "LDR Node - 03",
            device_type: "ldr_sensor",
            location: "Warehouse",
            value: "320 Lux",
            is_online: true,
            icon: Sun,
            colorHex: "#f59e0b"
        }
    ];

    const displayNodes = devices.length > 0 
        ? devices.slice(0, 4).map(d => ({
            device_id: d.device_id,
            device_type: d.device_type,
            location: d.device_type === "ldr_sensor" ? "Warehouse" : d.device_type === "air_quality_monitor" ? "Factory B" : d.device_type === "energy_meter" ? "Main Panel" : "Factory A",
            value: d.device_type === "ldr_sensor" ? "320 Lux" : d.device_type === "air_quality_monitor" ? "AQI 38" : d.device_type === "energy_meter" ? "3.62 kW" : "24.5 °C",
            is_online: d.is_online,
            icon: d.device_type === "ldr_sensor" ? Sun : d.device_type === "air_quality_monitor" ? Droplets : d.device_type === "energy_meter" ? Zap : Wifi,
            colorHex: d.device_type === "ldr_sensor" ? "#f59e0b" : d.device_type === "air_quality_monitor" ? "#06b6d4" : d.device_type === "energy_meter" ? "#a855f7" : "#10b981"
        }))
        : sampleRecentNodes;

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 select-none"
        >
            {/* Onboarding Modal for New Users */}
            {user && !user.full_name && <OnboardingModal />}

            {/* WELCOME HEADER ROW matching Dashboard.png */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        Welcome back, <span className="text-white">{user?.full_name?.split(' ')[0] || "Admin"}</span> 👋
                    </h1>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                        Monitor your IoT devices and stay in control.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <Clock size={15} className="text-blue-400" />
                    <span>{currentTimeStr || "10:30 AM • 22 May 2025"}</span>
                </div>
            </motion.div>

            {/* TOP 4 STATS BENTO CARDS GRID matching Dashboard.png */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Stat 1: Total Devices */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-blue-500/20 bg-slate-900/60 hover:border-blue-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Monitor size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Devices</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">{stats.total}</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online {stats.active}
                            </span>
                            {/* Blue Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 15 Q 12 8 25 14 T 50 5" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stat 2: Active Devices */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-emerald-500/20 bg-slate-900/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Activity size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Devices</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">{stats.active}</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                {activePct}% of total
                            </span>
                            {/* Green Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 18 Q 15 10 30 15 T 50 8" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stat 3: Alerts */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-purple-500/20 bg-slate-900/60 hover:border-purple-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Bell size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alerts</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">{stats.warning}</div>
                        <div className="flex items-center justify-between mt-2">
                            <Link to="/devices" className="text-[10px] text-purple-400 font-bold uppercase tracking-wider hover:underline">
                                View all
                            </Link>
                            {/* Purple Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 14 Q 20 18 35 8 T 50 12" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stat 4: Uptime */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-cyan-500/20 bg-slate-900/60 hover:border-cyan-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                            <BarChart2 size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Uptime</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">{stats.uptime}</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                This month
                            </span>
                            {/* Cyan Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 16 Q 15 6 30 12 T 50 4" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* MIDDLE ROW: DEVICE STATUS & LIVE DATA OVERVIEW matching Dashboard.png */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT: Device Status Progress Arc Gauge (4 Cols) */}
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="lg:col-span-4 neo-card p-6 border border-blue-500/20 bg-slate-900/60 flex flex-col justify-between h-full min-h-[380px]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base font-extrabold text-white">Device Status</h2>
                        <Link to="/devices" className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                            View all <ChevronRight size={14} />
                        </Link>
                    </div>

                    {/* Circular Progress Gauge matching Dashboard.png */}
                    <div className="relative flex flex-col items-center justify-center py-6 my-auto">
                        <svg className="w-52 h-52 overflow-visible" viewBox="0 0 120 120">
                            <defs>
                                <linearGradient id="statusCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                                <filter id="glowStatus" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            {/* Background Circle */}
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                            {/* Progress Circle (75%) */}
                            <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="url(#statusCircleGrad)"
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeDasharray={Math.PI * 100}
                                strokeDashoffset={(Math.PI * 100) * (1 - activePct / 100)}
                                transform="rotate(-90 60 60)"
                                filter="url(#glowStatus)"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        {/* Center Display Text */}
                        <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-black text-white tracking-tight">{activePct}%</span>
                            <span className="text-[11px] text-slate-400 font-semibold mt-0.5">All Systems</span>
                            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest mt-0.5">Normal</span>
                        </div>
                    </div>

                    {/* Bottom Status Legend matching Dashboard.png */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-center">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span> Online
                            </span>
                            <span className="text-base font-black text-white mt-0.5">{stats.active}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]"></span> Offline
                            </span>
                            <span className="text-base font-black text-white mt-0.5">{stats.offline}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span> Warning
                            </span>
                            <span className="text-base font-black text-white mt-0.5">{stats.warning}</span>
                        </div>
                    </div>
                </motion.div>

                {/* RIGHT: Live Data Overview Trend Chart (8 Cols) */}
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="lg:col-span-8 neo-card p-6 border border-blue-500/20 bg-slate-900/60 flex flex-col justify-between h-full min-h-[380px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h2 className="text-base font-extrabold text-white">Live Data Overview</h2>
                        <select
                            value={selectedMetric}
                            onChange={e => setSelectedMetric(e.target.value)}
                            className="bg-slate-950 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                        >
                            <option value="temperature">Temperature (°C)</option>
                            <option value="gas">Gas Concentration (PPM)</option>
                            <option value="aqi">Air Quality Index (AQI)</option>
                            <option value="light">Light Intensity (LUX)</option>
                            <option value="energy">Power Consumption (kW)</option>
                        </select>
                    </div>

                    {/* Spline Area Chart matching Dashboard.png */}
                    <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="overviewAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="time"
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey={selectedMetric}
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#overviewAreaGrad)"
                                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#020617' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* BOTTOM ROW: RECENT DEVICES BENTO GRID matching Dashboard.png */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-base font-extrabold text-white">Recent Devices</h2>
                    <Link to="/devices" className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                        View all <ArrowUpRight size={14} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {displayNodes.map((node, idx) => {
                        const IconComp = node.icon;
                        return (
                            <Link
                                key={idx}
                                to={`/devices/${encodeURIComponent(node.device_id)}`}
                                className="neo-card p-4 border border-white/10 bg-slate-900/60 hover:border-blue-500/40 transition-all flex items-center justify-between group cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="p-3 rounded-2xl border" 
                                        style={{ 
                                            backgroundColor: `${node.colorHex}15`, 
                                            borderColor: `${node.colorHex}30`, 
                                            color: node.colorHex 
                                        }}
                                    >
                                        <IconComp size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-extrabold text-white group-hover:text-blue-400 transition-colors truncate max-w-[120px]">
                                            {node.device_id}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-medium">{node.location}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-xs font-black text-white">{node.value}</div>
                                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
