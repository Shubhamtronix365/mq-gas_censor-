import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Wind, Thermometer, Droplets, Activity, Zap, Copy, Check, Key, 
    ChevronLeft, ChevronRight, Power, ShieldCheck, Gauge, Skull, Sun, Sliders, Clock
} from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import NodeStatusBadge from "../components/NodeStatusBadge";

const AirQualityDashboard = ({ id, device }) => {
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isScreenOn, setIsScreenOn] = useState(true);
    const [activeScreenMode, setActiveScreenMode] = useState(0); // 0: AQI Overview, 1: Particulates, 2: Gases, 3: Environment
    const [timeRange, setTimeRange] = useState("24h");
    const [currentTimeStr, setCurrentTimeStr] = useState("");

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " • " + now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${id}/readings?limit=20`);
            const data = response.data.reverse();
            setReadings(data);
            if (data.length > 0) {
                setLatest(data[data.length - 1]);
            }
        } catch (error) {
            console.error("Error fetching air quality readings:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (device?.device_token) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(device.device_token);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = device.device_token;
                textArea.style.position = "absolute";
                textArea.style.left = "-9999px";
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand("copy");
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrevScreen = () => {
        if (!isScreenOn) return;
        setActiveScreenMode(prev => (prev === 0 ? 3 : prev - 1));
    };

    const handleNextScreen = () => {
        if (!isScreenOn) return;
        setActiveScreenMode(prev => (prev === 3 ? 0 : prev + 1));
    };

    // Telemetry values with fallbacks matching interface
    const aqiVal = latest?.iaq ?? latest?.aqi ?? 28;
    const pm25Val = latest?.pm25 ?? 18;
    const pm10Val = latest?.pm10 ?? 28;
    const tempVal = latest?.temperature ? Number(latest.temperature).toFixed(1) : "28.6";
    const humidityVal = latest?.humidity ? Number(latest.humidity).toFixed(0) : "65";
    const co2Val = latest?.co2 ? Number(latest.co2).toFixed(0) : "520";
    const o2Val = latest?.oxygen ? Number(latest.oxygen).toFixed(1) : "20.9";
    const vocVal = latest?.voc ?? latest?.voc_index ?? 124;
    const hchoVal = latest?.hcho ? Number(latest.hcho).toFixed(2) : "0.02";
    const pressureVal = latest?.pressure ? Number(latest.pressure).toFixed(0) : "1013";

    const aqiPct = Math.min(100, Math.max(0, Math.round((aqiVal / 500) * 100)));
    const aqiStatus = aqiVal <= 50 ? "Good" : aqiVal <= 100 ? "Moderate" : aqiVal <= 200 ? "Unhealthy" : "Hazardous";
    const aqiColorHex = aqiVal <= 50 ? "#10b981" : aqiVal <= 100 ? "#f59e0b" : "#ef4444";

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#020617]/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl min-w-[180px]">
                    <p className="text-xs text-slate-400 mb-2 font-medium border-b border-white/5 pb-2">{new Date(label).toLocaleTimeString()}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{entry.name}</span>
                            <span className="text-sm font-bold" style={{ color: entry.color }}>
                                {Number(entry.value).toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Reusable Semi-Circular Arc Gauge Component
    const renderArcGauge = (val, min, max, colorHex, label, unit = "", statusText = "", size = "normal") => {
        const pct = Math.min(100, Math.max(0, Math.round(((val - min) / (max - min)) * 100)));
        const circumference = Math.PI * 45;
        const strokeDashoffset = circumference - (pct / 100) * circumference;

        return (
            <div className="relative flex flex-col items-center justify-center py-1 select-none">
                <svg className={size === "lg" ? "w-44 h-24 overflow-visible" : "w-28 h-16 overflow-visible"} viewBox="0 0 110 60">
                    <defs>
                        <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={colorHex} stopOpacity={0.7} />
                            <stop offset="100%" stopColor={colorHex} />
                        </linearGradient>
                        <filter id={`glow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
                    <path
                        d="M 10 55 A 45 45 0 0 1 100 55"
                        fill="none"
                        stroke={`url(#grad-${label})`}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        filter={`url(#glow-${label})`}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                <div className="absolute bottom-0 flex flex-col items-center">
                    <span className="text-lg font-black text-white tracking-tight">{val} <span className="text-[9px] text-slate-400 font-normal">{unit}</span></span>
                </div>
            </div>
        );
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 select-none"
        >
            {/* Header Section matching Air quality interface.png */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                        <Wind size={24} className="text-teal-400 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            ENVIRONMENT MONITORING SYSTEM
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                            Node ID: <span className="text-slate-300 font-mono font-bold">{id}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 uppercase font-bold tracking-wider">IndianIoT <span className="text-teal-400">by TRONIX365</span></span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                    {/* Device Token Pill */}
                    {device && (
                        <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 group">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DEVICE TOKEN</span>
                            <Key size={13} className="text-teal-400" />
                            <code className="text-xs font-mono text-slate-300 max-w-[180px] md:max-w-[240px] truncate select-all">{device.device_token}</code>
                            <button
                                onClick={copyToClipboard}
                                className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                                title="Copy Token"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                    )}

                    {/* Clock & Date Badge */}
                    <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Clock size={14} className="text-teal-400" />
                        <span>{currentTimeStr || "10:24 AM • 24 May 2025"}</span>
                    </div>

                    {/* Dynamic Online Badge */}
                    <NodeStatusBadge device={device} lastSeen={latest?.timestamp} timeoutSeconds={30} />
                </div>
            </motion.div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Air Quality Node (Rugged Physical Console Unit) */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <motion.div 
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} 
                        className="relative mx-auto max-w-md w-full bg-gradient-to-b from-[#252830] to-[#15171c] border-4 border-[#353942] rounded-[2.5rem] p-4 md:p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(255,255,255,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.5)] flex flex-col gap-4"
                    >
                        {/* Engraved TRONIX365 Top Bezel Brand Mark */}
                        <div className="text-[10px] font-black tracking-[0.35em] text-slate-400/90 uppercase text-center select-none shadow-sm py-0.5">
                            TRONIX<span className="text-teal-400">365</span>
                        </div>

                        {/* Side Glowing Cyan/Teal LED Light Strips */}
                        <div className="absolute top-16 bottom-14 left-0 w-1.5 bg-[#06b6d4] shadow-[0_0_15px_#06b6d4,0_0_8px_#06b6d4] rounded-r-full"></div>
                        <div className="absolute top-16 bottom-14 right-0 w-1.5 bg-[#06b6d4] shadow-[0_0_15px_#06b6d4,0_0_8px_#06b6d4] rounded-l-full"></div>

                        {/* Top-Left Hex Screw */}
                        <div className="absolute top-3.5 left-3.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>
                        {/* Top-Right Hex Screw */}
                        <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>
                        {/* Bottom-Left Hex Screw */}
                        <div className="absolute bottom-3.5 left-3.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>
                        {/* Bottom-Right Hex Screw */}
                        <div className="absolute bottom-3.5 right-3.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>

                        {/* Top Status LED Bar */}
                        <div className="flex justify-center w-full mb-0.5">
                            <div className={clsx(
                                "w-24 h-2 rounded-full border border-slate-900 transition-all duration-500",
                                !isScreenOn 
                                    ? "bg-slate-800 shadow-none" 
                                    : "bg-[#06b6d4] shadow-[0_0_15px_#06b6d4,0_0_5px_#06b6d4]"
                            )}></div>
                        </div>

                        {/* LCD Recessed Screen */}
                        <div className="relative overflow-hidden bg-[#080a11] rounded-2xl border-2 border-[#16191f] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] p-5 min-h-[310px] flex flex-col justify-between transition-all duration-300">
                            {/* Subtle CRT scanlines overlay */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[size:100%_4px]"></div>
                            {/* Glass Reflection overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] rounded-2xl"></div>

                            {!isScreenOn ? (
                                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-800 font-mono text-xs tracking-widest uppercase">
                                    <Power size={24} className="text-slate-800 animate-pulse" />
                                    <span>CONTROLLER STANDBY</span>
                                </div>
                            ) : (
                                <>
                                    {/* Screen Header */}
                                    <div className="text-center border-b border-white/5 pb-2">
                                        <div className="text-xs font-black text-slate-300 tracking-[0.25em] uppercase">TRONIX<span className="text-teal-400">365</span></div>
                                        <div className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">
                                            {activeScreenMode === 0 ? "AIR QUALITY INDEX" :
                                             activeScreenMode === 1 ? "PARTICULATE MATTER" :
                                             activeScreenMode === 2 ? "GAS TELEMETRY" : "ATMOSPHERIC DATA"}
                                        </div>
                                    </div>

                                    {/* Center Display Area - Dynamic per activeScreenMode */}
                                    {activeScreenMode === 0 && (
                                        /* Mode 0: AQI Overview */
                                        <div className="flex flex-col items-center justify-center py-2 gap-2">
                                            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">{aqiStatus}</div>
                                            
                                            {/* AQI Semi-Circular Gauge */}
                                            <div className="relative flex flex-col items-center justify-center">
                                                <svg className="w-36 h-20 overflow-visible" viewBox="0 0 120 65">
                                                    <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
                                                    <path
                                                        d="M 10 60 A 50 50 0 0 1 110 60"
                                                        fill="none"
                                                        stroke={aqiColorHex}
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        strokeDasharray={Math.PI * 50}
                                                        strokeDashoffset={(Math.PI * 50) - (aqiPct / 100) * (Math.PI * 50)}
                                                        className="transition-all duration-700 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute bottom-1 flex flex-col items-center">
                                                    <span className="text-3xl font-black text-white tracking-tight">{aqiVal}</span>
                                                    <span className="text-[10px] text-slate-500 font-semibold mt-[-2px]">/500</span>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-slate-400 text-center leading-relaxed max-w-[200px] mt-1">
                                                Air quality is satisfactory and poses minimal risk.
                                            </p>
                                            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider">
                                                UPDATED {latest ? "Just now" : "2 mins ago"}
                                            </span>
                                        </div>
                                    )}

                                    {activeScreenMode === 1 && (
                                        /* Mode 1: Particulate Matter Focus */
                                        <div className="flex flex-col items-center justify-center py-3 gap-3">
                                            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                                                <Wind size={28} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-center w-full">
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase">PM2.5</div>
                                                    <div className="text-2xl font-black text-white">{pm25Val} <span className="text-[9px] text-slate-500">µg/m³</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase">PM10</div>
                                                    <div className="text-2xl font-black text-purple-400">{pm10Val} <span className="text-[9px] text-slate-500">µg/m³</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeScreenMode === 2 && (
                                        /* Mode 2: Gas Telemetry Focus */
                                        <div className="flex flex-col items-center justify-center py-3 gap-2">
                                            <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30">
                                                <Zap size={28} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-center w-full">
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold">CO₂</div>
                                                    <div className="text-xl font-black text-white">{co2Val} <span className="text-[8px] text-slate-500">PPM</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold">VOC</div>
                                                    <div className="text-xl font-black text-amber-400">{vocVal} <span className="text-[8px] text-slate-500">Idx</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeScreenMode === 3 && (
                                        /* Mode 3: Atmospheric Focus */
                                        <div className="flex flex-col items-center justify-center py-3 gap-2">
                                            <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
                                                <Thermometer size={28} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-center w-full">
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold">TEMP</div>
                                                    <div className="text-xl font-black text-white">{tempVal} <span className="text-[8px] text-slate-500">°C</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-400 font-bold">HUMIDITY</div>
                                                    <div className="text-xl font-black text-cyan-400">{humidityVal} <span className="text-[8px] text-slate-500">%</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* LCD Bottom Page Indicator Dots */}
                                    <div className="flex justify-center items-center gap-1.5 pt-1 border-t border-white/5">
                                        {[0, 1, 2, 3].map(modeIdx => (
                                            <div
                                                key={modeIdx}
                                                onClick={() => setActiveScreenMode(modeIdx)}
                                                className={clsx(
                                                    "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
                                                    activeScreenMode === modeIdx ? "bg-teal-400 w-3 shadow-[0_0_6px_#06b6d4]" : "bg-slate-700 hover:bg-slate-500"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bezel Controls */}
                        <div className="flex justify-center items-center gap-5 mt-0.5">
                            <button 
                                onClick={handlePrevScreen}
                                disabled={!isScreenOn}
                                className={clsx(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-[0_4px_6px_rgba(0,0,0,0.4)] active:scale-95",
                                    isScreenOn ? "bg-slate-800 text-slate-300 hover:text-white cursor-pointer" : "bg-slate-900 text-slate-700 cursor-not-allowed opacity-50"
                                )}
                                title="Previous Screen Mode"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <button 
                                onClick={() => setIsScreenOn(prev => !prev)}
                                className="w-11 h-11 rounded-full bg-gradient-to-b from-[#2d3139] to-[#1a1c20] hover:from-[#353a43] hover:to-[#22252a] border border-slate-700/60 shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                                title="Power Toggle"
                            >
                                <Power size={18} className={clsx(
                                    "transition-all duration-300",
                                    isScreenOn ? "text-teal-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "text-slate-600"
                                )} />
                            </button>

                            <button 
                                onClick={handleNextScreen}
                                disabled={!isScreenOn}
                                className={clsx(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-[0_4px_6px_rgba(0,0,0,0.4)] active:scale-95",
                                    isScreenOn ? "bg-slate-800 text-slate-300 hover:text-white cursor-pointer" : "bg-slate-900 text-slate-700 cursor-not-allowed opacity-50"
                                )}
                                title="Next Screen Mode"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: Top 4 Highlight Cards & 7 Gas Arc Gauges */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-8">
                    
                    {/* TOP 4 QUICK METRIC CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        
                        {/* Card 1: PARTICULATE MATTER */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-4 border border-purple-500/20 bg-slate-900/60 hover:border-purple-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                                    <Wind size={18} />
                                </div>
                                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">PARTICULATE MATTER</h3>
                            </div>
                            <div className="flex justify-between items-baseline my-1">
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">PM2.5</span>
                                    <div className="text-xl font-black text-white">{pm25Val} <span className="text-[9px] text-slate-500 font-normal">µg/m³</span></div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">PM10</span>
                                    <div className="text-xl font-black text-purple-400">{pm10Val} <span className="text-[9px] text-slate-500 font-normal">µg/m³</span></div>
                                </div>
                            </div>
                            {/* Sparkline curve */}
                            <div className="w-full h-7 mt-1 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                                    <path d="M 0 18 Q 20 8 40 16 T 80 10 T 100 14" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-1">• Good</span>
                        </motion.div>

                        {/* Card 2: TEMPERATURE */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-4 border border-blue-500/20 bg-slate-900/60 hover:border-blue-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                                    <Thermometer size={18} />
                                </div>
                                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">TEMPERATURE</h3>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">TEMP.</span>
                                <div className="text-2xl font-black text-white">{tempVal} <span className="text-xs font-semibold text-slate-500">°C</span></div>
                            </div>
                            {/* Sparkline curve */}
                            <div className="w-full h-7 mt-1 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                                    <path d="M 0 14 Q 25 20 50 10 T 75 16 T 100 12" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider mt-1">• Normal</span>
                        </motion.div>

                        {/* Card 3: HUMIDITY */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-4 border border-pink-500/20 bg-slate-900/60 hover:border-pink-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.2)]">
                                    <Droplets size={18} />
                                </div>
                                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">HUMIDITY</h3>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase">RELATIVE HUMIDITY</span>
                                <div className="text-2xl font-black text-white">{humidityVal} <span className="text-xs font-semibold text-slate-500">%</span></div>
                            </div>
                            {/* Sparkline curve */}
                            <div className="w-full h-7 mt-1 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                                    <path d="M 0 16 Q 30 10 60 18 T 100 8" fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider mt-1">• Normal</span>
                        </motion.div>

                        {/* Card 4: SAFETY INDEX */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-4 border border-emerald-500/20 bg-slate-900/60 hover:border-emerald-500/40 transition-all flex flex-col items-center justify-between relative overflow-hidden text-center">
                            <div className="flex items-center gap-1.5 self-start">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">SAFETY INDEX</h3>
                            </div>
                            <div className="relative flex flex-col items-center justify-center my-1">
                                <svg className="w-28 h-16 overflow-visible" viewBox="0 0 110 60">
                                    <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round" />
                                    <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeDasharray={Math.PI * 45} strokeDashoffset={0} />
                                </svg>
                                <div className="absolute bottom-0 flex flex-col items-center">
                                    <ShieldCheck size={18} className="text-emerald-400 mb-0.5" />
                                    <span className="text-xs font-black text-emerald-400 tracking-wider">SAFE</span>
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium">All systems normal</span>
                        </motion.div>
                    </div>

                    {/* MIDDLE ROW 1: 7 SEMI-CIRCULAR ARC GAUGES GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                        
                        {/* CO2 Gauge */}
                        <div className="neo-card p-3 border border-purple-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Wind size={12} className="text-purple-400" /> CO₂
                            </div>
                            {renderArcGauge(co2Val, 300, 2000, "#a855f7", "co2", "ppm")}
                            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1">• Normal</span>
                        </div>

                        {/* O2 Gauge */}
                        <div className="neo-card p-3 border border-red-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Activity size={12} className="text-red-400" /> O₂
                            </div>
                            {renderArcGauge(o2Val, 15, 25, "#ef4444", "o2", "%")}
                            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1">• Normal</span>
                        </div>

                        {/* VOC Index Gauge */}
                        <div className="neo-card p-3 border border-amber-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Zap size={12} className="text-amber-400" /> VOC INDEX
                            </div>
                            {renderArcGauge(vocVal, 0, 500, "#f59e0b", "voc", "Idx")}
                            <span className="text-[9px] text-amber-400 font-bold uppercase mt-1">• Moderate</span>
                        </div>

                        {/* HCHO Gauge */}
                        <div className="neo-card p-3 border border-pink-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Skull size={12} className="text-pink-400" /> HCHO
                            </div>
                            {renderArcGauge(hchoVal, 0, 1, "#ec4899", "hcho", "PPM")}
                            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1">• Good</span>
                        </div>

                        {/* Air Pressure Gauge */}
                        <div className="neo-card p-3 border border-yellow-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Gauge size={12} className="text-yellow-400" /> PRESSURE
                            </div>
                            {renderArcGauge(pressureVal, 900, 1100, "#eab308", "press", "hPa")}
                            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1">• Normal</span>
                        </div>

                        {/* Temp Gauge */}
                        <div className="neo-card p-3 border border-blue-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Thermometer size={12} className="text-blue-400" /> TEMP
                            </div>
                            {renderArcGauge(tempVal, 0, 50, "#3b82f6", "temp", "°C")}
                            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1">• Normal</span>
                        </div>

                        {/* Humidity Gauge */}
                        <div className="neo-card p-3 border border-teal-500/10 bg-slate-900/50 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                                <Droplets size={12} className="text-teal-400" /> HUMIDITY
                            </div>
                            {renderArcGauge(humidityVal, 0, 100, "#06b6d4", "hum", "%")}
                            <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1">• Normal</span>
                        </div>
                    </div>

                </div>

            </div>

            {/* MIDDLE ROW 2: DUAL TREND CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* AIR QUALITY INDEX TREND */}
                <div className="lg:col-span-6 neo-card p-6 h-[380px] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-teal-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                            AIR QUALITY INDEX TREND
                        </h3>
                        <select 
                            value={timeRange} 
                            onChange={e => setTimeRange(e.target.value)}
                            className="bg-slate-900 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                        </select>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorAQI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 200]}
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="iaq"
                                    name="AQI / IAQ"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAQI)"
                                    dot={{ fill: '#06b6d4', r: 4, strokeWidth: 2, stroke: '#020617' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* DUST CONCENTRATION (µg/m³) */}
                <div className="lg:col-span-6 neo-card p-6 h-[380px] flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                            DUST CONCENTRATION (µg/m³)
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold">
                                <span className="w-2 h-2 rounded-full bg-purple-400"></span> PM2.5
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold">
                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> PM10
                            </div>
                            <select 
                                value={timeRange} 
                                onChange={e => setTimeRange(e.target.value)}
                                className="bg-slate-900 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                            >
                                <option value="24h">Last 24 Hours</option>
                                <option value="7d">Last 7 Days</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={readings}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 3 }} />
                                <Line type="monotone" dataKey="pm10" name="PM10" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4', r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* BOTTOM ROW: CORRELATION PROFILING GAUGES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* GAS CHEMICAL PROFILING */}
                <div className="lg:col-span-6 neo-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-5 bg-teal-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        <h3 className="text-base font-extrabold text-white">GAS CHEMICAL PROFILING</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-6 pl-3.5">Correlation of CO₂, VOC Index, & HCHO</p>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        {/* CO2 - VOC */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">CO₂ - VOC</span>
                            <div className="text-xl font-black text-white">0.63</div>
                            {renderArcGauge(0.63, -1, 1, "#a855f7", "co2voc", "", "", "small")}
                            <span className="text-[9px] text-purple-400 font-bold mt-1">Positive Correlation</span>
                        </div>
                        {/* CO2 - HCHO */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">CO₂ - HCHO</span>
                            <div className="text-xl font-black text-white">0.45</div>
                            {renderArcGauge(0.45, -1, 1, "#f59e0b", "co2hcho", "", "", "small")}
                            <span className="text-[9px] text-amber-400 font-bold mt-1">Moderate Correlation</span>
                        </div>
                        {/* VOC - HCHO */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">VOC - HCHO</span>
                            <div className="text-xl font-black text-white">0.71</div>
                            {renderArcGauge(0.71, -1, 1, "#ec4899", "vochcho", "", "", "small")}
                            <span className="text-[9px] text-pink-400 font-bold mt-1">Strong Correlation</span>
                        </div>
                    </div>
                </div>

                {/* ATMOSPHERIC ENVIRONMENT */}
                <div className="lg:col-span-6 neo-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-5 bg-red-400 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                        <h3 className="text-base font-extrabold text-white">ATMOSPHERIC ENVIRONMENT</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-6 pl-3.5">Temperature, Humidity, & Pressure correlation</p>

                    <div className="grid grid-cols-3 gap-4 text-center">
                        {/* TEMP - HUMIDITY */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">TEMP - HUMIDITY</span>
                            <div className="text-xl font-black text-white">-0.38</div>
                            {renderArcGauge(-0.38, -1, 1, "#ef4444", "temphum", "", "", "small")}
                            <span className="text-[9px] text-red-400 font-bold mt-1">Negative Correlation</span>
                        </div>
                        {/* HUMIDITY - PRESSURE */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">HUMIDITY - PRESSURE</span>
                            <div className="text-xl font-black text-white">0.22</div>
                            {renderArcGauge(0.22, -1, 1, "#3b82f6", "humpress", "", "", "small")}
                            <span className="text-[9px] text-blue-400 font-bold mt-1">Weak Correlation</span>
                        </div>
                        {/* TEMP - PRESSURE */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">TEMP - PRESSURE</span>
                            <div className="text-xl font-black text-white">0.31</div>
                            {renderArcGauge(0.31, -1, 1, "#f59e0b", "temppress", "", "", "small")}
                            <span className="text-[9px] text-amber-400 font-bold mt-1">Weak Correlation</span>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AirQualityDashboard;
