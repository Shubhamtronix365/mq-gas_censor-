import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Key, Copy, Check, Edit3, ArrowUpRight, Cloud, Target, Power, ChevronLeft, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { clsx } from 'clsx';
import { useAuth } from "../context/AuthContext";
import IconPickerSidebar from "../components/IconPickerSidebar";
import { motion } from "framer-motion";

const GasDashboard = ({ id, device }) => {
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Icon customization state
    const { user, updateUser } = useAuth();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeSensor, setActiveSensor] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isScreenOn, setIsScreenOn] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${id}/readings?limit=20`);
            const data = response.data.reverse();
            setReadings(data);
            if (data.length > 0) {
                setLatest(data[data.length - 1]);
            }
        } catch (error) {
            console.error("Error fetching readings:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (device?.device_token) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(device.device_token);
            } else {
                // Fallback for HTTP/LAN
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

    const getStatusColor = (status) => {
        switch (status) {
            case "DANGER": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "WARNING": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
            default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        }
    };

    const handleSensorClick = (sensorType) => {
        setActiveSensor(sensorType);
        setPickerOpen(true);
    };

    const handleIconSelect = async (iconName) => {
        if (!activeSensor) return;
        const newPreferences = {
            ...(user.preferences || {}),
            [`icon_${activeSensor}`]: iconName
        };
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
                preferences: newPreferences
            });
            updateUser({ preferences: newPreferences });
        } catch (error) {
            console.error("Failed to save icon preference", error);
            alert("Failed to save customization.");
        }
    };

    const getSensorIcon = (sensorType, DefaultIcon) => {
        if (user?.preferences?.[`icon_${sensorType}`]) {
            const IconName = user.preferences[`icon_${sensorType}`];
            return LucideIcons[IconName] || DefaultIcon;
        }
        return DefaultIcon;
    };



    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#020617]/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
                    <p className="text-xs text-slate-400 mb-2 font-medium">{new Date(label).toLocaleTimeString()}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-sm font-bold text-white">
                                {entry.name}: {Number(entry.value).toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const metrics = [
        {
            key: 'gas',
            sensorType: 'Gas',
            title: 'Gas Level',
            value: latest?.gas ? Number(latest.gas).toFixed(0) : null,
            unit: 'PPM',
            icon: getSensorIcon('Gas', Cloud),
            color: 'text-sky-400',
            borderColor: 'border-sky-500/40',
            bgGlow: 'shadow-[0_0_25px_rgba(14,165,233,0.3)]',
            iconColor: 'text-sky-400 bg-sky-500/10',
            glowColor: 'rgba(14, 165, 233, 0.4)',
        },
        {
            key: 'temperature',
            sensorType: 'Temperature',
            title: 'Temperature',
            value: latest?.temperature ? Number(latest.temperature).toFixed(1) : null,
            unit: '°C',
            icon: getSensorIcon('Temperature', Thermometer),
            color: 'text-fuchsia-400',
            borderColor: 'border-fuchsia-500/40',
            bgGlow: 'shadow-[0_0_25px_rgba(217,70,239,0.3)]',
            iconColor: 'text-fuchsia-400 bg-fuchsia-500/10',
            glowColor: 'rgba(217, 70, 239, 0.4)',
        },
        {
            key: 'humidity',
            sensorType: 'Humidity',
            title: 'Humidity',
            value: latest?.humidity ? Number(latest.humidity).toFixed(1) : null,
            unit: '%',
            icon: getSensorIcon('Humidity', Droplets),
            color: 'text-blue-400',
            borderColor: 'border-blue-500/40',
            bgGlow: 'shadow-[0_0_25px_rgba(59,130,246,0.3)]',
            iconColor: 'text-blue-400 bg-blue-500/10',
            glowColor: 'rgba(59, 130, 246, 0.4)',
        },
        {
            key: 'distance',
            sensorType: 'Distance',
            title: 'Distance',
            value: latest?.distance ? Number(latest.distance).toFixed(1) : null,
            unit: 'cm',
            icon: getSensorIcon('Distance', Target),
            color: 'text-emerald-400',
            borderColor: 'border-emerald-500/40',
            bgGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.3)]',
            iconColor: 'text-emerald-400 bg-emerald-500/10',
            glowColor: 'rgba(16, 185, 129, 0.4)',
        }
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header Section */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        {id}
                        {latest && (
                            <span className={clsx("text-xs px-3 py-1 rounded-full border font-bold shadow-[0_0_15px_rgba(0,0,0,0.3)]", getStatusColor(latest.status))}>
                                {latest.status}
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                        <Activity size={16} className="text-violet-400" />
                        Real-time gas & environment monitoring
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
                    <div className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-wider">
                        Last updated: <span className="text-white ml-2">{latest ? new Date(latest.timestamp).toLocaleTimeString() : "--:--:--"}</span>
                    </div>
                    {device && (
                        <div className="bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto flex items-center gap-2 pr-4 transition-all hover:bg-white/10 group">
                            <div className="bg-white/5 px-3 py-2 rounded-lg border-r border-white/5">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device Token</p>
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Key size={14} className="text-violet-400 shrink-0" />
                                <code className="text-xs font-mono text-white select-all truncate opacity-80 group-hover:opacity-100 transition-opacity">{device.device_token}</code>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white relative"
                                title="Copy"
                            >
                                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Responsive Main Display Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Column 1: Custom Rugged Sensor Unit Console (Adjusted Size) */}
                <div className="lg:col-span-6 xl:col-span-5 flex justify-center items-center w-full">
                    <motion.div 
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} 
                        className="relative mx-auto max-w-lg w-full bg-gradient-to-b from-[#2a2e35] to-[#181a1e] border-4 border-[#3a3f47] rounded-[2.5rem] p-5 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),_inset_0_2px_4px_rgba(255,255,255,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.4)] flex flex-col gap-5 select-none"
                    >
                        {/* Top-Left Hex Screw */}
                        <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-3 h-3 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>
                        {/* Top-Right Hex Screw */}
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-3 h-3 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>
                        {/* Bottom-Left Hex Screw */}
                        <div className="absolute bottom-4 left-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-3 h-3 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>
                        {/* Bottom-Right Hex Screw */}
                        <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br from-[#121315] to-[#2d3139] border border-slate-800 flex items-center justify-center shadow-inner">
                            <div className="w-3 h-3 rounded-full bg-[#1c1d21] border border-[#0d0e10] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]">
                                <div className="w-1 h-1 rounded-full bg-[#2a2d33]"></div>
                            </div>
                        </div>

                        {/* Top Status LED Bar */}
                        <div className="flex justify-center w-full mt-1 mb-0.5">
                            <div className={clsx(
                                "w-28 h-2 rounded-full bg-slate-950 border border-slate-900 transition-all duration-500",
                                !isScreenOn 
                                    ? "bg-slate-800 shadow-none" 
                                    : latest?.status === "DANGER"
                                        ? "bg-[#ef4444] shadow-[0_0_15px_#ef4444,0_0_5px_#ef4444]"
                                        : latest?.status === "WARNING"
                                            ? "bg-[#f59e0b] shadow-[0_0_15px_#f59e0b,0_0_5px_#f59e0b]"
                                            : "bg-[#10b981] shadow-[0_0_15px_#10b981,0_0_5px_#10b981]"
                            )}></div>
                        </div>

                        {/* LCD Recessed Screen */}
                        <div className="relative overflow-hidden bg-[#080a11] rounded-2xl border-2 border-[#16191f] shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)] p-5 min-h-[240px] flex flex-col justify-between transition-all duration-300">
                            {/* Subtle CRT screen scanlines pattern */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[size:100%_4px]"></div>
                            
                            {/* Screen Glass Reflection overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] rounded-2xl"></div>

                            {!isScreenOn ? (
                                /* Powered-off screen state */
                                <div className="flex-1 flex items-center justify-center text-slate-800 font-mono text-xs tracking-widest uppercase">
                                    SYSTEM STANDBY
                                </div>
                            ) : (
                                /* Powered-on active display */
                                <>
                                    {/* Header */}
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">GAS SENSOR UNIT</div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={clsx(
                                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                                latest ? "bg-emerald-500" : "bg-slate-500"
                                            )}></span>
                                            <span className={clsx(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                latest ? "text-emerald-400" : "text-slate-400"
                                            )}>
                                                {latest ? "ONLINE" : "STANDBY"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="flex items-center justify-between py-4 gap-4">
                                        {/* Left: Active Icon in Circle */}
                                        <div 
                                            onClick={() => handleSensorClick(metrics[activeIndex].sensorType)}
                                            className={clsx(
                                                "relative w-20 h-20 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 group hover:scale-105 shrink-0",
                                                metrics[activeIndex].borderColor,
                                                metrics[activeIndex].bgGlow
                                            )}
                                        >
                                            {/* Edit Icon Hover overlay */}
                                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Edit3 size={14} />
                                            </div>
                                            <div className={clsx("p-3 rounded-full transition-transform duration-300", metrics[activeIndex].iconColor)}>
                                                {(() => {
                                                    const IconComponent = metrics[activeIndex].icon;
                                                    return <IconComponent size={28} className="stroke-[2]" />;
                                                })()}
                                            </div>
                                        </div>

                                        {/* Right: Text Information */}
                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                            <div className={clsx("text-xs font-bold uppercase tracking-widest mb-1", metrics[activeIndex].color)}>
                                                {metrics[activeIndex].title}
                                            </div>
                                            <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5 leading-none">
                                                {metrics[activeIndex].value ?? "--"}
                                                <span className="text-base text-slate-400 font-semibold">{metrics[activeIndex].unit}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-1.5">
                                                <span className={clsx(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/5 border border-white/5",
                                                    latest?.status === "DANGER"
                                                        ? "text-red-400 border-red-500/20"
                                                        : latest?.status === "WARNING"
                                                            ? "text-yellow-400 border-yellow-500/20"
                                                            : "text-emerald-400 border-emerald-500/20"
                                                )}>
                                                    {latest?.status === "DANGER" 
                                                        ? "Critical" 
                                                        : latest?.status === "WARNING" 
                                                            ? "Warning" 
                                                            : "Normal"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Secondary Inactive Metrics Row */}
                                    <div className="border-t border-white/5 pt-2.5 flex justify-between items-center">
                                        {metrics.map((m, idx) => {
                                            if (idx === activeIndex) return null;
                                            const SmallIcon = m.icon;
                                            return (
                                                <div 
                                                    key={m.key} 
                                                    onClick={() => setActiveIndex(idx)}
                                                    className="flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded-lg hover:bg-white/5"
                                                >
                                                    <span className={clsx("p-1 rounded-md", m.iconColor)}>
                                                        <SmallIcon size={12} className="stroke-[2.5]" />
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-300">
                                                        {m.value ?? "--"}
                                                        <span className="text-[9px] text-slate-500 font-medium ml-0.5">{m.unit}</span>
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bezel Controls */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex justify-center items-center gap-6 mt-1">
                                {/* Left Button */}
                                <button 
                                    onClick={() => {
                                        if (isScreenOn) {
                                            setActiveIndex((prev) => (prev - 1 + 4) % 4);
                                        }
                                    }}
                                    disabled={!isScreenOn}
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 select-none outline-none border border-slate-700/60 shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95",
                                        isScreenOn
                                            ? "bg-gradient-to-b from-[#2d3139] to-[#1a1c20] hover:from-[#353a43] hover:to-[#22252a] text-slate-400 hover:text-white cursor-pointer"
                                            : "bg-gradient-to-b from-[#22252e] to-[#15171a] text-slate-700 opacity-50 cursor-not-allowed"
                                    )}
                                    title="Previous View"
                                >
                                    <ChevronLeft size={18} className="stroke-[2.5]" />
                                </button>

                                {/* Central Power Button */}
                                <button 
                                    onClick={() => setIsScreenOn((prev) => !prev)}
                                    className="w-12 h-12 rounded-full bg-gradient-to-b from-[#2d3139] to-[#1a1c20] hover:from-[#353a43] hover:to-[#22252a] border border-slate-700/60 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center active:scale-95 transition-all cursor-pointer group"
                                    title={isScreenOn ? "Power Off" : "Power On"}
                                >
                                    <Power size={20} className={clsx(
                                        "transition-all duration-300 stroke-[2.5]",
                                        isScreenOn 
                                            ? "text-[#3b82f6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" 
                                            : "text-slate-500 hover:text-slate-400"
                                    )} />
                                </button>

                                {/* Right Button */}
                                <button 
                                    onClick={() => {
                                        if (isScreenOn) {
                                            setActiveIndex((prev) => (prev + 1) % 4);
                                        }
                                    }}
                                    disabled={!isScreenOn}
                                    className={clsx(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 select-none outline-none border border-slate-700/60 shadow-[0_4px_6px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95",
                                        isScreenOn
                                            ? "bg-gradient-to-b from-[#2d3139] to-[#1a1c20] hover:from-[#353a43] hover:to-[#22252a] text-slate-400 hover:text-white cursor-pointer"
                                            : "bg-gradient-to-b from-[#22252e] to-[#15171a] text-slate-700 opacity-50 cursor-not-allowed"
                                    )}
                                    title="Next View"
                                >
                                    <ChevronRight size={18} className="stroke-[2.5]" />
                                </button>
                            </div>
                            <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest text-center">
                                PRESS LEFT / RIGHT TO SWITCH VIEW
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Column 2: Side Readings Panel (Text format readings displayed simultaneously) */}
                <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center gap-4">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></div>
                            Side Readings (Text View)
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                            Simultaneous Real-time View
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {metrics.map((m, idx) => {
                            const SideIcon = m.icon;
                            const isActive = idx === activeIndex && isScreenOn;

                            return (
                                <motion.div
                                    key={m.key}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (!isScreenOn) setIsScreenOn(true);
                                        setActiveIndex(idx);
                                    }}
                                    className={clsx(
                                        "neo-card p-5 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden flex flex-col justify-between group",
                                        isActive 
                                            ? "border-violet-500/50 bg-gradient-to-br from-violet-500/10 to-slate-900/90 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                                            : "border-white/5 bg-slate-900/40 hover:border-white/20 hover:bg-slate-900/80"
                                    )}
                                >
                                    {/* Active Indicator Line */}
                                    {isActive && (
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-sky-400"></div>
                                    )}

                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx("p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-300", m.iconColor)}>
                                                <SideIcon size={18} className="stroke-[2.5]" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">{m.title}</h4>
                                                <span className="text-[10px] text-slate-500 font-mono">STATUS: ACTIVE</span>
                                            </div>
                                        </div>
                                        <span className={clsx(
                                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border",
                                            latest?.status === "DANGER"
                                                ? "text-red-400 bg-red-500/10 border-red-500/20"
                                                : latest?.status === "WARNING"
                                                    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                        )}>
                                            {latest?.status === "DANGER" ? "Critical" : latest?.status === "WARNING" ? "Warning" : "Normal"}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline justify-between mt-1">
                                        <div className="text-3xl font-extrabold text-white tracking-tight">
                                            {m.value ?? "--"}
                                            <span className="text-sm text-slate-400 font-medium ml-1.5">{m.unit}</span>
                                        </div>
                                        <span className="text-[10px] text-violet-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                            Focus Unit <ArrowUpRight size={12} />
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <IconPickerSidebar
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                sensorType={activeSensor}
                currentIcon={user?.preferences?.[`icon_${activeSensor}`]}
                onSelectIcon={handleIconSelect}
            />

            {/* Charts */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="neo-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                            Gas Trends
                        </h3>
                        <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
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
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="gas"
                                    name="Gas Level"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorGas)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="neo-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                            Environment
                        </h3>
                        <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                            <Activity size={18} />
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="temperature"
                                    name="Temp (°C)"
                                    stroke="#f97316"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTemp)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="humidity"
                                    name="Humidity (%)"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorHum)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default GasDashboard;
