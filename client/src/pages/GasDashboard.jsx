import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Key, Copy, Check, Edit3, ArrowUpRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { clsx } from 'clsx';
import { useAuth } from "../context/AuthContext";
import IconPickerSidebar from "../components/IconPickerSidebar";
import { motion } from "framer-motion";
import GasSensorCard from "../components/GasSensorCard";

const GasDashboard = ({ id, device }) => {
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Icon customization state
    const { user, updateUser } = useAuth();
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeSensor, setActiveSensor] = useState(null);

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

            {/* Sensor Grid */}
            <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <GasSensorCard
                    title="Gas Level"
                    value={latest?.gas ? Number(latest.gas).toFixed(0) : null}
                    unit="ppm"
                    Icon={getSensorIcon('Gas', Wind)}
                    onClick={() => handleSensorClick('Gas')}
                    accentColor="violet"
                    colorClass="bg-violet-500/20 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                />
                <GasSensorCard
                    title="Temperature"
                    value={latest?.temperature ? Number(latest.temperature).toFixed(1) : null}
                    unit="°C"
                    Icon={getSensorIcon('Temperature', Thermometer)}
                    onClick={() => handleSensorClick('Temperature')}
                    accentColor="orange"
                    colorClass="bg-orange-500/20 text-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.15)]"
                />
                <GasSensorCard
                    title="Humidity"
                    value={latest?.humidity ? Number(latest.humidity).toFixed(1) : null}
                    unit="%"
                    Icon={getSensorIcon('Humidity', Droplets)}
                    onClick={() => handleSensorClick('Humidity')}
                    accentColor="blue"
                    colorClass="bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.15)]"
                />
                <GasSensorCard
                    title="Distance"
                    value={latest?.distance ? Number(latest.distance).toFixed(1) : null}
                    unit="cm"
                    Icon={getSensorIcon('Distance', Activity)}
                    onClick={() => handleSensorClick('Distance')}
                    accentColor="emerald"
                    colorClass="bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                />
            </motion.div>

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
