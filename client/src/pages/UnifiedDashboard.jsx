import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Sun, Zap, Power, Plus, Key, Copy, Check, Waves, ArrowUpRight, Cpu } from "lucide-react";
import AutoBulb from "../components/AutoBulb";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const UnifiedDashboard = ({ id, device }) => {
    const [gasReadings, setGasReadings] = useState([]);
    const [ldrReadings, setLdrReadings] = useState([]);
    const [mergedData, setMergedData] = useState([]);
    const [latestGas, setLatestGas] = useState(null);
    const [latestLdr, setLatestLdr] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Outputs state
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
            const [gasRes, ldrRes, outputsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${id}/readings?limit=20`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/readings?limit=20`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/outputs`)
            ]);

            // Process Gas Data
            const gasData = gasRes.data.reverse();
            setGasReadings(gasData);
            if (gasData.length > 0) setLatestGas(gasData[gasData.length - 1]);

            // Process LDR Data
            const ldrData = ldrRes.data.reverse(); // Ensure chronological
            setLdrReadings(ldrData);
            if (ldrData.length > 0) setLatestLdr(ldrData[ldrData.length - 1]);

            // Merge Data for Dual Chart (approximate matching by index/time if needed, or just display latest overlap)
            // For simplicity in this demo, we'll map them by index if timestamps align, or just take the length of the shorter one
            const minLength = Math.min(gasData.length, ldrData.length);
            const merged = [];
            for (let i = 0; i < minLength; i++) {
                merged.push({
                    timestamp: gasData[i].timestamp, // Prefer gas timestamp or average
                    gas: gasData[i].gas,
                    light: ldrData[i].analog_value
                });
            }
            setMergedData(merged);

            setOutputs(outputsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (device?.device_token) {
            navigator.clipboard.writeText(device.device_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAddOutput = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/outputs`, {
                device_id: id,
                output_name: newOutputName,
                gpio_pin: parseInt(newOutputPin),
                is_active: false
            });
            setShowAddOutput(false);
            setNewOutputName("");
            setNewOutputPin("");
            fetchData();
        } catch (error) {
            alert("Failed to add output");
        }
    };

    const toggleOutput = async (output) => {
        try {
            const updatedOutputs = outputs.map(o =>
                o.id === output.id ? { ...o, is_active: !o.is_active } : o
            );
            setOutputs(updatedOutputs);

            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/ldr/outputs/${output.id}`, {
                is_active: !output.is_active
            });
        } catch (error) {
            console.error("Failed to toggle output:", error);
            fetchData();
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#020617]/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl min-w-[200px]">
                    <p className="text-xs text-slate-400 mb-3 font-medium border-b border-white/5 pb-2">{new Date(label).toLocaleTimeString()}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{entry.name}</span>
                            <span className="text-sm font-bold" style={{ color: entry.color }}>
                                {Number(entry.value).toFixed(0)} <span className="text-[10px] text-slate-500 ml-1">{entry.name === 'Gas' ? 'PPM' : 'LUX'}</span>
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const SensorCard = ({ title, value, unit, icon: Icon, color }) => (
        <motion.div
            variants={item}
            className={clsx(
                "neo-card p-5 relative overflow-hidden group border",
                color === 'violet' ? 'border-violet-500/20 hover:border-violet-500/40' :
                    color === 'amber' ? 'border-yellow-500/20 hover:border-yellow-500/40' :
                        color === 'cyan' ? 'border-cyan-500/20 hover:border-cyan-500/40' :
                            'border-rose-500/20 hover:border-rose-500/40'
            )}
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity duration-500`}>
                <Icon size={64} className={clsx(
                    color === 'violet' ? 'text-violet-500' :
                        color === 'amber' ? 'text-yellow-500' :
                            color === 'cyan' ? 'text-cyan-500' : 'text-rose-500'
                )} />
            </div>

            <div className={clsx("p-3 rounded-2xl w-fit mb-4 border transition-colors duration-300",
                color === 'violet' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400 group-hover:bg-violet-500/20' :
                    color === 'amber' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/20' :
                        color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20' :
                            'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20'
            )}>
                <Icon size={24} />
            </div>

            <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</h3>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white tracking-tight">
                    {value ?? "--"}
                </span>
                <span className="text-sm text-slate-500 font-medium">{unit}</span>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="max-w-[1920px] mx-auto space-y-6 pb-20"
        >
            {/* Header */}
            <motion.div variants={item} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 rounded-3xl bg-gradient-to-r from-violet-500/5 to-amber-500/5 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-500 opacity-50"></div>

                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/5 text-white border border-white/10 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={12} className="text-fuchsia-400" /> Fusion Core
                        </span>
                        <span className={clsx("w-2 h-2 rounded-full animate-pulse", loading ? "bg-yellow-500" : "bg-emerald-500")}></span>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-1">
                        {id}
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Dual-Sensor Telemetry & Integrated Control System
                    </p>
                </div>

                <div className="flex gap-3">
                    {device && (
                        <div className="neo-card px-4 py-2 flex items-center gap-4 group cursor-pointer hover:border-violet-500/30 transition-all" onClick={copyToClipboard}>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Device Token</span>
                                <code className="text-xs font-mono text-violet-300 group-hover:text-white transition-colors">
                                    {device.device_token?.substring(0, 8)}...
                                </code>
                            </div>
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-colors">
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Column 1: Gas Stats (Violet Theme) */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-violet-400 mb-2 px-1">
                        <Waves size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Environment</span>
                    </div>
                    <SensorCard
                        title="Air Quality"
                        value={latestGas?.gas ? Number(latestGas.gas).toFixed(0) : null}
                        unit="PPM"
                        icon={Wind}
                        color="violet"
                    />
                    <SensorCard
                        title="Temperature"
                        value={latestGas?.temperature ? Number(latestGas.temperature).toFixed(1) : null}
                        unit="°C"
                        icon={Thermometer}
                        color="rose"
                    />
                    <SensorCard
                        title="Humidity"
                        value={latestGas?.humidity ? Number(latestGas.humidity).toFixed(1) : null}
                        unit="%"
                        icon={Droplets}
                        color="cyan"
                    />
                </div>

                {/* Column 2 & 3: Fusion Chart (Spans 2 cols) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <motion.div variants={item} className="neo-card p-6 flex-1 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Activity size={18} className="text-fuchsia-400" />
                                    Fusion Correlation
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">Real-time overlay of Gas (PPM) vs Light (Intensity)</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                    <span className="text-xs text-slate-400 font-bold">Gas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span className="text-xs text-slate-400 font-bold">Light</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[300px] w-full z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mergedData}>
                                    <defs>
                                        <linearGradient id="colorGasFusion" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLightFusion" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis yAxisId="left" hide />
                                    <YAxis yAxisId="right" orientation="right" hide />
                                    <Tooltip content={<CustomTooltip />} />

                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="gas"
                                        name="Gas"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="url(#colorGasFusion)"
                                        animationDuration={1500}
                                    />
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="light"
                                        name="Light"
                                        stroke="#eab308"
                                        strokeWidth={3}
                                        fill="url(#colorLightFusion)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                    </motion.div>
                </div>

                {/* Column 4: Light Stats & Controls (Amber Theme) */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2 px-1">
                        <Sun size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Illumination</span>
                    </div>

                    <SensorCard
                        title="Intensity"
                        value={latestLdr?.analog_value ?? "--"}
                        unit="LUX"
                        icon={Sun}
                        color="amber"
                    />

                    <motion.div variants={item} className="neo-card p-5 flex flex-col gap-4 border border-white/5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Control Deck</h3>
                            <button
                                onClick={() => setShowAddOutput(!showAddOutput)}
                                className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {showAddOutput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-white/5 p-3 rounded-xl mb-2"
                            >
                                <form onSubmit={handleAddOutput} className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Label"
                                        className="neo-input text-[10px] py-1.5 px-2"
                                        required
                                        value={newOutputName}
                                        onChange={e => setNewOutputName(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="GPIO"
                                            className="neo-input text-[10px] py-1.5 px-2 w-16"
                                            required
                                            value={newOutputPin}
                                            onChange={e => setNewOutputPin(e.target.value)}
                                        />
                                        <button type="submit" className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-[10px] font-bold hover:brightness-110 transition-all">Add</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}


                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {/* Auto Bulb Status */}
                            <div className="group p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${latestLdr?.digital_value ? 'bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                                        <Sun size={14} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-xs">AutoLogic</h4>
                                        <p className="text-[10px] text-slate-500 font-mono">SENSOR CONTROL</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${latestLdr?.digital_value ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`}></div>
                            </div>

                            {/* Manual Outputs */}
                            {outputs.map(output => (
                                <div key={output.id} className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-fuchsia-500/30 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${output.is_active ? 'bg-fuchsia-500/20 text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 'bg-slate-800 text-slate-500'}`}>
                                            <Power size={14} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-xs">{output.output_name}</h4>
                                            <p className="text-[10px] text-slate-500 font-mono">PIN {output.gpio_pin}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleOutput(output)}
                                        className={`relative w-10 h-5 rounded-full transition-all duration-300 ${output.is_active
                                            ? 'bg-fuchsia-600 shadow-[0_0_10px_rgba(217,70,239,0.5)]'
                                            : 'bg-slate-700'
                                            }`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-300 ${output.is_active ? 'left-6' : 'left-1'
                                            }`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default UnifiedDashboard;
