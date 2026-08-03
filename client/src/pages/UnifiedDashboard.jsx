import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
    Wind, Thermometer, Droplets, Sun, Zap, Lightbulb, Activity, Gauge, Volume2, BatteryCharging,
    Power, Plus, Key, Copy, Check, Calendar, Sliders, Cpu, Radio, ShieldCheck, Atom
} from "lucide-react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import NodeStatusBadge from "../components/NodeStatusBadge";

const UnifiedDashboard = ({ id, device }) => {
    const [gasReadings, setGasReadings] = useState([]);
    const [ldrReadings, setLdrReadings] = useState([]);
    const [mergedData, setMergedData] = useState([]);
    const [latestGas, setLatestGas] = useState(null);
    const [latestLdr, setLatestLdr] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [timeRange, setTimeRange] = useState("24H");

    // Output pin creation state
    const [showAddOutput, setShowAddOutput] = useState(false);
    const [newOutputName, setNewOutputName] = useState("");
    const [newOutputPin, setNewOutputPin] = useState("");

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchData = async () => {
        try {
            const cleanId = encodeURIComponent(id.trim());
            const [gasRes, ldrRes, outputsRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${cleanId}/readings?limit=20`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${cleanId}/readings?limit=20`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${cleanId}/outputs`)
            ]);

            // Process Gas Data
            const gasData = gasRes.status === "fulfilled" ? gasRes.value.data.reverse() : [];
            setGasReadings(gasData);
            if (gasData.length > 0) setLatestGas(gasData[gasData.length - 1]);

            // Process LDR Data
            const ldrData = ldrRes.status === "fulfilled" ? ldrRes.value.data.reverse() : [];
            setLdrReadings(ldrData);
            if (ldrData.length > 0) setLatestLdr(ldrData[ldrData.length - 1]);

            // Merge Data for Dual Axis Overlay Chart
            const maxLength = Math.max(gasData.length, ldrData.length);
            const merged = [];
            for (let i = 0; i < maxLength; i++) {
                const gasPoint = gasData[i] || {};
                const ldrPoint = ldrData[i] || {};
                merged.push({
                    timestamp: gasPoint.timestamp || ldrPoint.timestamp || new Date().toISOString(),
                    gas: gasPoint.gas ?? (gasPoint.iaq ? gasPoint.iaq * 2 : null),
                    light: ldrPoint.analog_value ?? null
                });
            }
            setMergedData(merged);

            const outputsData = outputsRes.status === "fulfilled" ? outputsRes.value.data : [];
            setOutputs(outputsData);
        } catch (error) {
            console.error("Error fetching unified readings:", error);
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

    const handleToggleOutput = async (outputId, currentStatus) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/ldr/outputs/${outputId}`, {
                status: !currentStatus
            });
            fetchData();
        } catch (error) {
            console.error("Error toggling output:", error);
        }
    };

    const handleAddOutput = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/outputs`, {
                name: newOutputName,
                pin: parseInt(newOutputPin)
            });
            setNewOutputName("");
            setNewOutputPin("");
            setShowAddOutput(false);
            fetchData();
        } catch (error) {
            console.error("Error adding output:", error);
        }
    };

    // Telemetry extraction
    const aqiVal = latestGas?.iaq ?? latestGas?.aqi ?? (latestGas?.gas ? Math.min(500, Math.round(latestGas.gas / 2)) : null);
    const tempVal = latestGas?.temperature !== undefined && latestGas?.temperature !== null ? Number(latestGas.temperature).toFixed(1) : null;
    const humidityVal = latestGas?.humidity !== undefined && latestGas?.humidity !== null ? Number(latestGas.humidity).toFixed(0) : null;
    const gasPpm = latestGas?.gas !== undefined && latestGas?.gas !== null ? Number(latestGas.gas).toFixed(0) : null;
    const lightLux = latestLdr?.analog_value !== undefined && latestLdr?.analog_value !== null ? Number(latestLdr.analog_value).toFixed(0) : null;
    const co2Val = latestGas?.co2 !== undefined && latestGas?.co2 !== null ? Number(latestGas.co2).toFixed(0) : null;
    const vocVal = latestGas?.voc ?? latestGas?.voc_index ?? null;
    const pressureVal = latestGas?.pressure !== undefined && latestGas?.pressure !== null ? Number(latestGas.pressure).toFixed(0) : null;
    const o2Val = latestGas?.oxygen !== undefined && latestGas?.oxygen !== null ? Number(latestGas.oxygen).toFixed(1) : null;
    const noiseVal = latestGas?.noise !== undefined && latestGas?.noise !== null ? Number(latestGas.noise).toFixed(0) : null;
    const batteryVal = latestGas?.battery !== undefined && latestGas?.battery !== null ? Number(latestGas.battery).toFixed(0) : null;

    // Active outputs count & main bulb state
    const activeOutputs = outputs.filter(o => o.status).length;
    const isBulbActive = activeOutputs > 0 || (latestLdr?.relay_status ?? false);

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
                <div className="bg-[#020617]/95 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shadow-xl min-w-[170px]">
                    <p className="text-[11px] text-slate-400 mb-2 font-medium border-b border-white/5 pb-1.5">{new Date(label).toLocaleTimeString()}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{entry.name}</span>
                            <span className="text-sm font-bold" style={{ color: entry.color }}>
                                {entry.value !== null && entry.value !== undefined ? Number(entry.value).toFixed(0) : "--"}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Reusable Dynamic Semi-Circular Arc Gauge Component
    const renderArcGauge = (val, min, max, colorHex, label, unit = "", statusText = "", size = "normal") => {
        const numVal = val !== null && val !== undefined ? Number(val) : null;
        const pct = numVal !== null ? Math.min(100, Math.max(0, Math.round(((numVal - min) / (max - min)) * 100))) : 0;
        const circumference = Math.PI * 45;
        const strokeDashoffset = circumference - (pct / 100) * circumference;

        return (
            <div className="relative flex flex-col items-center justify-center py-1 select-none">
                <svg className={size === "lg" ? "w-44 h-24 overflow-visible" : size === "sm" ? "w-24 h-14 overflow-visible" : "w-32 h-18 overflow-visible"} viewBox="0 0 110 60">
                    <defs>
                        <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={numVal !== null ? colorHex : "#475569"} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={numVal !== null ? colorHex : "#475569"} />
                        </linearGradient>
                        <filter id={`glow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
                    {/* Tick Mark Accents */}
                    <path d="M 10 55 A 45 45 0 0 1 100 55" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeDasharray="2, 6" />
                    <path
                        d="M 10 55 A 45 45 0 0 1 100 55"
                        fill="none"
                        stroke={`url(#grad-${label})`}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        filter={numVal !== null ? `url(#glow-${label})` : "none"}
                        className="transition-all duration-700 ease-out"
                    />
                </svg>
                <div className="absolute bottom-0 flex flex-col items-center">
                    <span className="text-xl font-black text-white tracking-tight">
                        {numVal !== null ? numVal : "--"} <span className="text-[9px] text-slate-400 font-normal">{unit}</span>
                    </span>
                    {statusText && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{statusText}</span>}
                </div>
            </div>
        );
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6 select-none"
        >
            {/* TOP HEADER SECTION matching Fusion Node.png */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)] flex items-center gap-2">
                        <Cpu size={24} className="text-purple-400 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-widest px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30">
                            FUSION CORE
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            fusion<span className="text-purple-400">.</span>
                            <span className="text-xs font-medium text-slate-400 tracking-normal hidden md:inline">
                                Dual-Sensor Telemetry & Integrated Control System
                            </span>
                        </h1>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                            Node ID: <span className="text-slate-300 font-mono font-bold">{id}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 uppercase font-bold tracking-wider">IndianIoT <span className="text-purple-400">by TRONIX365</span></span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                    {/* Device Token Pill */}
                    {device && (
                        <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 group">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DEVICE TOKEN</span>
                            <Key size={13} className="text-purple-400" />
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

                    {/* Dynamic Online Badge */}
                    <NodeStatusBadge device={device} lastSeen={latestGas?.timestamp || latestLdr?.timestamp} timeoutSeconds={30} />
                </div>
            </motion.div>

            {/* MAIN DASHBOARD LAYOUT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: ENVIRONMENT (3 Vertical Gauge Cards) */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sliders size={16} className="text-purple-400" />
                        <h2 className="text-xs font-extrabold text-slate-300 uppercase tracking-widest">ENVIRONMENT</h2>
                    </div>

                    {/* Card 1: AIR QUALITY */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="neo-card p-4 border border-purple-500/20 bg-slate-900/60 hover:border-purple-500/40 transition-all flex flex-col items-center justify-between text-center relative overflow-hidden">
                        <div className="flex items-center gap-2 self-start mb-1">
                            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                                <Wind size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">AIR QUALITY</span>
                        </div>
                        {renderArcGauge(aqiVal, 0, 100, "#a855f7", "aqi_left", "PPM", "", "normal")}
                        <div className="flex justify-between items-center w-full text-[9px] text-slate-500 font-bold px-2 mt-[-6px]">
                            <span>0</span>
                            <span className={clsx("uppercase tracking-wider font-extrabold", aqiVal !== null ? "text-emerald-400" : "text-slate-500")}>
                                {aqiVal !== null ? "• Good" : "• Waiting"}
                            </span>
                            <span>100</span>
                        </div>
                    </motion.div>

                    {/* Card 2: TEMPERATURE */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="neo-card p-4 border border-rose-500/20 bg-slate-900/60 hover:border-rose-500/40 transition-all flex flex-col items-center justify-between text-center relative overflow-hidden">
                        <div className="flex items-center gap-2 self-start mb-1">
                            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                                <Thermometer size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">TEMPERATURE</span>
                        </div>
                        {renderArcGauge(tempVal, 0, 50, "#f43f5e", "temp_left", "°C", "", "normal")}
                        <div className="flex justify-between items-center w-full text-[9px] text-slate-500 font-bold px-2 mt-[-6px]">
                            <span>0°C</span>
                            <span className={clsx("uppercase tracking-wider font-extrabold", tempVal !== null ? "text-rose-400" : "text-slate-500")}>
                                {tempVal !== null ? "• Normal" : "• Waiting"}
                            </span>
                            <span>50°C</span>
                        </div>
                    </motion.div>

                    {/* Card 3: HUMIDITY */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="neo-card p-4 border border-cyan-500/20 bg-slate-900/60 hover:border-cyan-500/40 transition-all flex flex-col items-center justify-between text-center relative overflow-hidden">
                        <div className="flex items-center gap-2 self-start mb-1">
                            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                                <Droplets size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">HUMIDITY</span>
                        </div>
                        {renderArcGauge(humidityVal, 0, 100, "#06b6d4", "hum_left", "%", "", "normal")}
                        <div className="flex justify-between items-center w-full text-[9px] text-slate-500 font-bold px-2 mt-[-6px]">
                            <span>0%</span>
                            <span className={clsx("uppercase tracking-wider font-extrabold", humidityVal !== null ? "text-cyan-400" : "text-slate-500")}>
                                {humidityVal !== null ? "• Normal" : "• Waiting"}
                            </span>
                            <span>100%</span>
                        </div>
                    </motion.div>
                </div>

                {/* MIDDLE SECTION: FUSION CORRELATION (Main Featured Panel) */}
                <div className="lg:col-span-6 neo-card p-6 border border-purple-500/20 bg-slate-900/70 shadow-2xl flex flex-col justify-between h-full min-h-[580px]">
                    <div>
                        {/* Title & Legend */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                                    <Activity size={20} className="text-purple-400" />
                                    Fusion Correlation
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Real-time overlay of Gas (PPM) vs Light (Intensity)</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-bold">
                                <div className="flex items-center gap-1.5 text-purple-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span> Gas (PPM)
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-400">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span> Light (LUX)
                                </div>
                            </div>
                        </div>

                        {/* Side-by-Side Featured Arc Gauges */}
                        <div className="grid grid-cols-2 gap-4 py-2 border-b border-white/5 mb-4">
                            {/* Gas Concentration Gauge */}
                            <div className="flex flex-col items-center text-center">
                                {renderArcGauge(gasPpm, 0, 1000, "#a855f7", "gas_featured", "PPM", "", "lg")}
                                <div className="flex justify-between items-center w-full max-w-[170px] text-[9px] text-slate-500 font-bold px-1 mt-[-8px]">
                                    <span>0</span>
                                    <span className="text-purple-400 font-extrabold uppercase tracking-wider">GAS CONCENTRATION</span>
                                    <span>1000</span>
                                </div>
                            </div>

                            {/* Light Intensity Gauge */}
                            <div className="flex flex-col items-center text-center">
                                {renderArcGauge(lightLux, 0, 5000, "#f59e0b", "light_featured", "LUX", "", "lg")}
                                <div className="flex justify-between items-center w-full max-w-[170px] text-[9px] text-slate-500 font-bold px-1 mt-[-8px]">
                                    <span>0</span>
                                    <span className="text-amber-400 font-extrabold uppercase tracking-wider">LIGHT INTENSITY</span>
                                    <span>5000</span>
                                </div>
                            </div>
                        </div>

                        {/* Dual Axis Line Chart */}
                        <div className="w-full h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={mergedData}>
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
                                        yAxisId="left"
                                        domain={[0, 1000]}
                                        stroke="#a855f7"
                                        tick={{ fontSize: 11, fontWeight: 500, fill: '#a855f7' }}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        domain={[0, 5000]}
                                        stroke="#f59e0b"
                                        tick={{ fontSize: 11, fontWeight: 500, fill: '#f59e0b' }}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={10}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line yAxisId="left" type="monotone" dataKey="gas" name="Gas (PPM)" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 3 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="light" name="Light (LUX)" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Time Range Selector Bar matching Fusion Node.png */}
                    <div className="flex items-center justify-center flex-wrap gap-2 pt-4 border-t border-white/5">
                        {["1H", "6H", "12H", "24H", "7D", "30D"].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={clsx(
                                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer",
                                    timeRange === range
                                        ? "bg-purple-600/40 text-purple-200 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                                        : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white cursor-pointer ml-1">
                            <Calendar size={15} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: ILLUMINATION & SMART BULB STATUS & CONTROL DECK */}
                <div className="lg:col-span-3 space-y-4">
                    
                    {/* Card 1: ILLUMINATION */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="neo-card p-4 border border-amber-500/20 bg-slate-900/60 hover:border-amber-500/40 transition-all flex flex-col items-center justify-between text-center relative overflow-hidden">
                        <div className="flex items-center gap-2 self-start mb-1">
                            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                                <Sun size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">ILLUMINATION</span>
                        </div>
                        {renderArcGauge(lightLux, 0, 5000, "#f59e0b", "illum_right", "LUX", "", "normal")}
                        <div className="flex justify-between items-center w-full text-[9px] text-slate-500 font-bold px-2 mt-[-6px]">
                            <span>0</span>
                            <span className={clsx("uppercase tracking-wider font-extrabold", lightLux !== null ? "text-amber-400" : "text-slate-500")}>
                                {lightLux !== null ? "• Moderate" : "• Waiting"}
                            </span>
                            <span>5000</span>
                        </div>
                    </motion.div>

                    {/* Card 2: SMART BULB STATUS */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="neo-card p-5 border border-cyan-500/20 bg-slate-900/60 flex flex-col items-center justify-between text-center relative overflow-hidden">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider self-start mb-3">SMART BULB STATUS</span>

                        {/* Circular Glowing Ring */}
                        <div className="relative flex flex-col items-center justify-center my-2">
                            <div className={clsx(
                                "w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500",
                                isBulbActive 
                                    ? "border-cyan-400 shadow-[0_0_30px_#06b6d4,inset_0_0_15px_#06b6d4] bg-cyan-500/10" 
                                    : "border-slate-800 shadow-none bg-slate-950/40"
                            )}>
                                <Lightbulb size={32} className={clsx(
                                    "transition-all duration-300 mb-1",
                                    isBulbActive ? "text-cyan-400 drop-shadow-[0_0_12px_#06b6d4]" : "text-slate-600"
                                )} />
                                <span className="text-sm font-black text-white uppercase tracking-widest">
                                    {isBulbActive ? "ACTIVE" : "IDLE"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-2 px-3 py-1 rounded-full bg-slate-950/60 border border-white/5 text-[10px] font-bold text-slate-400">
                            INTENSITY: <span className="text-cyan-400 font-mono font-black">{isBulbActive ? "100%" : "0%"}</span>
                        </div>
                    </motion.div>

                    {/* Card 3: CONTROL DECK (Outputs List & Add Pin Button) */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="neo-card p-4 border border-purple-500/20 bg-slate-900/60 space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Sliders size={16} className="text-purple-400" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">CONTROL DECK</span>
                            </div>
                            <button
                                onClick={() => setShowAddOutput(prev => !prev)}
                                className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-all cursor-pointer"
                                title="Add Output Pin"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Add Output Form Overlay */}
                        {showAddOutput && (
                            <form onSubmit={handleAddOutput} className="p-3 bg-slate-950/80 rounded-xl border border-purple-500/30 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Name (e.g. Flood Light)"
                                    value={newOutputName}
                                    onChange={e => setNewOutputName(e.target.value)}
                                    required
                                    className="w-full bg-slate-900 border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="GPIO Pin (e.g. 23)"
                                    value={newOutputPin}
                                    onChange={e => setNewOutputPin(e.target.value)}
                                    required
                                    className="w-full bg-slate-900 border border-white/10 text-white text-xs px-2.5 py-1.5 rounded-lg outline-none"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 rounded-lg transition-all"
                                >
                                    Save Output Pin
                                </button>
                            </form>
                        )}

                        {/* Outputs Grid */}
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {outputs.length === 0 ? (
                                <p className="text-[10px] text-slate-500 italic text-center py-2">No output pins configured.</p>
                            ) : (
                                outputs.map(output => (
                                    <div
                                        key={output.id}
                                        onClick={() => handleToggleOutput(output.id, output.status)}
                                        className={clsx(
                                            "p-2.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all duration-200",
                                            output.status 
                                                ? "bg-purple-950/40 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
                                                : "bg-slate-950/40 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Power size={14} className={output.status ? "text-purple-400" : "text-slate-600"} />
                                            <div>
                                                <div className="text-xs font-bold text-white">{output.name}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">GPIO {output.pin}</div>
                                            </div>
                                        </div>
                                        <span className={clsx(
                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                                            output.status ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-slate-800 text-slate-500"
                                        )}>
                                            {output.status ? "ON" : "OFF"}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                </div>

            </div>

            {/* BOTTOM ROW: SYSTEM OVERVIEW (6 Gauge Bento Grid matching Fusion Node.png) */}
            <div className="neo-card p-6 border border-white/10 bg-slate-900/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Activity size={18} className="text-purple-400" />
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-widest">SYSTEM OVERVIEW</h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                    
                    {/* Gauge 1: CO2 (PPM) */}
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-emerald-500/10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                                <Wind size={12} />
                            </div>
                            CO₂ (PPM)
                        </div>
                        {renderArcGauge(co2Val, 300, 2000, "#10b981", "co2_bento", "", "", "sm")}
                        <span className={clsx("text-[9px] font-bold uppercase mt-1", co2Val !== null ? "text-emerald-400" : "text-slate-500")}>
                            {co2Val !== null ? "• Good" : "• Waiting"}
                        </span>
                    </div>

                    {/* Gauge 2: VOC INDEX */}
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-amber-500/10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                            <div className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                                <Zap size={12} />
                            </div>
                            VOC INDEX
                        </div>
                        {renderArcGauge(vocVal, 0, 500, "#f59e0b", "voc_bento", "", "", "sm")}
                        <span className={clsx("text-[9px] font-bold uppercase mt-1", vocVal !== null ? "text-amber-400" : "text-slate-500")}>
                            {vocVal !== null ? "• Moderate" : "• Waiting"}
                        </span>
                    </div>

                    {/* Gauge 3: PRESSURE */}
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-cyan-500/10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                            <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                                <Gauge size={12} />
                            </div>
                            PRESSURE
                        </div>
                        {renderArcGauge(pressureVal, 900, 1100, "#06b6d4", "press_bento", "hPa", "", "sm")}
                        <span className={clsx("text-[9px] font-bold uppercase mt-1", pressureVal !== null ? "text-cyan-400" : "text-slate-500")}>
                            {pressureVal !== null ? "• Normal" : "• Waiting"}
                        </span>
                    </div>

                    {/* Gauge 4: OXYGEN (O2) */}
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-rose-500/10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                            <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
                                <Activity size={12} />
                            </div>
                            OXYGEN (O₂)
                        </div>
                        {renderArcGauge(o2Val, 15, 25, "#f43f5e", "o2_bento", "%", "", "sm")}
                        <span className={clsx("text-[9px] font-bold uppercase mt-1", o2Val !== null ? "text-rose-400" : "text-slate-500")}>
                            {o2Val !== null ? "• Normal" : "• Waiting"}
                        </span>
                    </div>

                    {/* Gauge 5: NOISE LEVEL */}
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-purple-500/10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                            <div className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                                <Volume2 size={12} />
                            </div>
                            NOISE LEVEL
                        </div>
                        {renderArcGauge(noiseVal, 0, 100, "#a855f7", "noise_bento", "dB", "", "sm")}
                        <span className={clsx("text-[9px] font-bold uppercase mt-1", noiseVal !== null ? "text-purple-400" : "text-slate-500")}>
                            {noiseVal !== null ? "• Low" : "• Waiting"}
                        </span>
                    </div>

                    {/* Gauge 6: BATTERY */}
                    <div className="bg-slate-950/50 p-3 rounded-2xl border border-emerald-500/10 flex flex-col items-center text-center">
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-300 uppercase mb-1">
                            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                                <BatteryCharging size={12} />
                            </div>
                            BATTERY
                        </div>
                        {renderArcGauge(batteryVal, 0, 100, "#10b981", "bat_bento", "%", "", "sm")}
                        <span className={clsx("text-[9px] font-bold uppercase mt-1", batteryVal !== null ? "text-emerald-400" : "text-slate-500")}>
                            {batteryVal !== null ? "• Good" : "• Waiting"}
                        </span>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};

export default UnifiedDashboard;
