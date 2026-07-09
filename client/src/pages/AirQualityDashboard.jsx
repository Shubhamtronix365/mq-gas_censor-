import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Zap, Copy, Check, Key, ArrowUpRight, Cpu, Skull, Gauge, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import UnifiedSensorCard from "../components/UnifiedSensorCard";

const AirQualityDashboard = ({ id, device }) => {
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${id}/readings?limit=20`);
            const data = response.data.reverse(); // chronological order
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

    const getStatusColor = (status) => {
        switch (status) {
            case "DANGER": return "text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
            case "WARNING": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]";
            default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
        }
    };

    const getStatusText = (iaq) => {
        if (iaq === null || iaq === undefined) return "Unknown";
        if (iaq <= 100) return "Excellent";
        if (iaq <= 250) return "Moderate";
        return "Unhealthy";
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0 }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#020617]/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl min-w-[200px]">
                    <p className="text-xs text-slate-400 mb-3 font-medium border-b border-white/5 pb-2">{new Date(label).toLocaleTimeString()}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{entry.name}</span>
                            <span className="text-sm font-bold" style={{ color: entry.color }}>
                                {Number(entry.value).toFixed(1)} <span className="text-[10px] text-slate-500 ml-1">{entry.unit || ''}</span>
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="max-w-[1920px] mx-auto space-y-8 pb-20"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-50"></div>

                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 text-white border border-white/10 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={12} className="text-emerald-400" /> Air Quality Node
                        </span>
                        <span className={clsx("w-2 h-2 rounded-full animate-pulse", loading ? "bg-yellow-500" : "bg-emerald-500")}></span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-1">
                        {id}
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Environmental Intelligence & Multi-Gas Monitoring System
                    </p>
                </div>

                <div className="flex gap-3">
                    {device && (
                        <div className="neo-card px-4 py-2 flex items-center gap-4 group cursor-pointer hover:border-emerald-500/30 transition-all" onClick={copyToClipboard}>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Device Token</span>
                                <code className="text-xs font-mono text-emerald-300 group-hover:text-white transition-colors">
                                    {device.device_token?.substring(0, 8)}...
                                </code>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Bento Grid layout */}
            <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* AQI Primary Hero Card */}
                <motion.div variants={item} className="md:col-span-2 neo-card p-6 flex flex-col justify-between border-emerald-500/20 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Status</span>
                            <h2 className="text-3xl font-extrabold text-white mt-1">Air Index</h2>
                        </div>
                        {latest && (
                            <span className={clsx("text-xs px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider", getStatusColor(latest.status))}>
                                {latest.status} - {getStatusText(latest.iaq)}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-8 my-6">
                        <div className="relative flex items-center justify-center">
                            {/* Inner Circle Glow */}
                            <div className={clsx(
                                "w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500",
                                latest?.status === "DANGER" ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)] bg-red-500/5" :
                                latest?.status === "WARNING" ? "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.2)] bg-yellow-500/5" :
                                "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-500/5"
                            )}>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">IAQ / AQI</span>
                                <span className="text-3xl font-black text-white">{latest?.iaq ?? "--"}</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                The Indoor Air Quality Index (IAQ) evaluates particulate matter, CO₂, VOCs, and HCHO levels to ensure respiratory safety.
                            </p>
                            <div className="flex gap-4 text-[10px] text-slate-500 font-bold">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Excellent (0-100)</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Moderate (101-250)</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 pt-4 border-t border-white/5 flex items-center gap-2">
                        <Activity size={12} className="text-emerald-400 animate-pulse" />
                        <span>Aggregated assessment algorithm active</span>
                    </div>
                </motion.div>

                {/* Particulate Matter Bento Cells */}
                <motion.div variants={item} className="neo-card p-6 flex flex-col justify-between border-cyan-500/10 hover:border-cyan-500/30">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Particulates</span>
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                                <Wind size={20} />
                            </div>
                        </div>
                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-1">PM2.5 Concentration</h4>
                        <div className="text-3xl font-black text-white flex items-baseline gap-1">
                            {latest?.pm25 !== null && latest?.pm25 !== undefined ? Number(latest.pm25).toFixed(1) : "--"}
                            <span className="text-xs text-slate-500 font-medium">µg/m³</span>
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-4 pt-3 border-t border-white/5">
                        Fine inhalable dust particles
                    </div>
                </motion.div>

                <motion.div variants={item} className="neo-card p-6 flex flex-col justify-between border-teal-500/10 hover:border-teal-500/30">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Particulates</span>
                            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                                <Zap size={20} />
                            </div>
                        </div>
                        <h4 className="text-slate-400 text-xs font-bold uppercase mb-1">PM10 Concentration</h4>
                        <div className="text-3xl font-black text-white flex items-baseline gap-1">
                            {latest?.pm10 !== null && latest?.pm10 !== undefined ? Number(latest.pm10).toFixed(1) : "--"}
                            <span className="text-xs text-slate-500 font-medium">µg/m³</span>
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-4 pt-3 border-t border-white/5">
                        Coarser atmospheric dust
                    </div>
                </motion.div>
                
            </motion.div>

            {/* Rest of the Parameters Bento Grid */}
            <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Temperature */}
                <UnifiedSensorCard
                    title="Temperature"
                    value={latest?.temperature ? Number(latest.temperature).toFixed(1) : null}
                    unit="°C"
                    icon={Thermometer}
                    color="rose"
                />

                {/* Humidity */}
                <UnifiedSensorCard
                    title="Humidity"
                    value={latest?.humidity ? Number(latest.humidity).toFixed(1) : null}
                    unit="%"
                    icon={Droplets}
                    color="cyan"
                />

                {/* CO2 */}
                <UnifiedSensorCard
                    title="Carbon Dioxide (CO₂)"
                    value={latest?.co2 ? Number(latest.co2).toFixed(0) : null}
                    unit="PPM"
                    icon={Wind}
                    color="violet"
                />

                {/* Oxygen */}
                <UnifiedSensorCard
                    title="Oxygen (O₂)"
                    value={latest?.oxygen ? Number(latest.oxygen).toFixed(1) : null}
                    unit="%"
                    icon={Activity}
                    color="emerald"
                />

                {/* VOC */}
                <UnifiedSensorCard
                    title="Volatile Compounds (VOC)"
                    value={latest?.voc ?? null}
                    unit="Index"
                    icon={Zap}
                    color="amber"
                />

                {/* HCHO */}
                <UnifiedSensorCard
                    title="Formaldehyde (HCHO)"
                    value={latest?.hcho ? Number(latest.hcho).toFixed(3) : null}
                    unit="PPM"
                    icon={Skull}
                    color="rose"
                />

                {/* Pressure */}
                <UnifiedSensorCard
                    title="Air Pressure"
                    value={latest?.pressure ? Number(latest.pressure).toFixed(1) : null}
                    unit="hPa"
                    icon={Gauge}
                    color="teal"
                />

                {/* Safe Indicator Check */}
                <motion.div variants={item} className="neo-card p-5 relative overflow-hidden group border border-emerald-500/10 bg-emerald-500/5">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Activity size={64} className="text-emerald-400" />
                    </div>
                    <div className="p-3 rounded-2xl w-fit mb-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Activity size={24} />
                    </div>
                    <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Safety Index</h3>
                    <div className="text-2xl font-bold text-white leading-tight">
                        {latest?.status === "DANGER" ? "HAZARD WARNING" : "ENVIRONMENT SAFE"}
                    </div>
                </motion.div>

            </motion.div>

            {/* Trends & Analytics Section */}
            <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* AQI / IAQ Trend Card */}
                <div className="neo-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                Air Quality Index Trend
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Indoor IAQ temporal progression</p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                            <ArrowUpRight size={18} />
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorAQI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="iaq"
                                    name="AQI / IAQ"
                                    unit=""
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAQI)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Particulate Matter Chart */}
                <div className="neo-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                                Dust Concentration (PM2.5 / PM10)
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Particulate matter overlay comparison</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">PM2.5</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">PM10</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorPM25" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPM10" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
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
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="pm25"
                                    name="PM2.5"
                                    unit=" µg/m³"
                                    stroke="#06b6d4"
                                    strokeWidth={2.5}
                                    fill="url(#colorPM25)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="pm10"
                                    name="PM10"
                                    unit=" µg/m³"
                                    stroke="#14b8a6"
                                    strokeWidth={2.5}
                                    fill="url(#colorPM10)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gas Chemicals Correlation Chart */}
                <div className="neo-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
                                Gas Chemical Profiling
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Correlation of CO₂, VOC Index, & HCHO</p>
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
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="co2"
                                    name="CO₂"
                                    unit=" ppm"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="voc"
                                    name="VOC"
                                    unit=" idx"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="hcho"
                                    name="HCHO"
                                    unit=" ppm"
                                    stroke="#ec4899"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Atmospheric Environment Chart */}
                <div className="neo-card p-6 h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
                                Atmospheric Environment
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Temperature, Humidity, & Pressure correlation</p>
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
                                />
                                <YAxis
                                    stroke="#475569"
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="temperature"
                                    name="Temp"
                                    unit=" °C"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="humidity"
                                    name="Humidity"
                                    unit=" %"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="pressure"
                                    name="Pressure"
                                    unit=" hPa"
                                    stroke="#14b8a6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </motion.div>

        </motion.div>
    );
};

export default AirQualityDashboard;
