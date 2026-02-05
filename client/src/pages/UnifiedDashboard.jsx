import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Sun, Zap, Power, Plus, Key, Copy, Check, Waves } from "lucide-react";
import AutoBulb from "../components/AutoBulb";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const UnifiedDashboard = ({ id, device }) => {
    const [gasReadings, setGasReadings] = useState([]);
    const [ldrReadings, setLdrReadings] = useState([]);
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

            const gasData = gasRes.data.reverse();
            setGasReadings(gasData);
            if (gasData.length > 0) setLatestGas(gasData[gasData.length - 1]);

            const ldrData = ldrRes.data; // Usually desc
            setLdrReadings(ldrData);
            if (ldrData.length > 0) setLatestLdr(ldrData[0]);

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
            // Optimistic update
            const updatedOutputs = outputs.map(o =>
                o.id === output.id ? { ...o, is_active: !o.is_active } : o
            );
            setOutputs(updatedOutputs);

            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/ldr/outputs/${output.id}`, {
                is_active: !output.is_active
            });
        } catch (error) {
            console.error("Failed to toggle output:", error);
            fetchData(); // Revert on error
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

    const SensorCard = ({ title, value, unit, icon: Icon, color, delay }) => (
        <motion.div
            variants={item}
            className="neo-card p-5 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity`}>
                <Icon size={48} className={`text-${color}-400`} />
            </div>

            <div className={`p-3 rounded-2xl w-fit mb-4 bg-${color}-500/10 border border-${color}-500/20 text-${color}-400`}>
                <Icon size={24} />
            </div>

            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
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
            className="max-w-[1920px] mx-auto space-y-8 pb-20"
        >
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-widest">
                            Fusion Node
                        </span>
                        {loading && <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>}
                    </motion.div>
                    <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
                        {id}
                    </h1>
                    <p className="text-slate-400 max-w-lg leading-relaxed">
                        Real-time telemetry and unified control interface.
                    </p>
                </div>

                {device && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="neo-card px-4 py-2 flex items-center gap-4 group cursor-pointer"
                        onClick={copyToClipboard}
                    >
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Secure Token</span>
                            <code className="text-sm font-mono text-violet-300 group-hover:text-violet-200 transition-colors">
                                {device.device_token?.substring(0, 12)}...
                            </code>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-slate-400" />}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* 1. Environment Metrics - Takes full width on mobile, 3 cols on large */}
                <div className="xl:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <SensorCard
                        title="Air Quality"
                        value={latestGas?.gas ? Number(latestGas.gas).toFixed(0) : null}
                        unit="PPM"
                        icon={Wind}
                        color="amber"
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
                    <SensorCard
                        title="Proximity"
                        value={latestGas?.distance ? Number(latestGas.distance).toFixed(1) : null}
                        unit="CM"
                        icon={Activity}
                        color="violet"
                    />
                </div>

                {/* 2. Light Status - Right Column */}
                <div className="xl:col-span-1 min-h-[160px]">
                    <motion.div variants={item} className="neo-card p-6 h-full flex flex-col justify-between overflow-hidden relative">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/20 blur-[60px] rounded-full pointer-events-none"></div>

                        <div className="flex justify-between items-start z-10">
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ambient Light</h3>
                                <div className="text-4xl font-bold text-white">
                                    {latestLdr?.analog_value ?? "--"}
                                </div>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
                                <Sun size={24} />
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between z-10">
                            <span className="text-xs text-slate-500 font-medium">Auto-Logic Status</span>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-lg ${latestLdr?.digital_value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${latestLdr?.digital_value ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></div>
                                <span className="text-[10px] font-bold uppercase">{latestLdr?.digital_value ? 'Active' : 'Standby'}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 3. Main Chart - Large area */}
                <motion.div variants={item} className="xl:col-span-3 neo-card flex flex-col min-h-[350px]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-600/20 rounded-lg text-violet-400">
                                <Waves size={20} />
                            </div>
                            <h3 className="font-bold text-white tracking-tight">Air Quality Trends</h3>
                        </div>

                        <div className="flex gap-2">
                            <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">LIVE NOW</span>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={gasReadings} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGasNeo" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="timestamp" hide />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#020617',
                                        borderColor: 'rgba(139, 92, 246, 0.2)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ color: '#a78bfa' }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="gas"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fill="url(#colorGasNeo)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* 4. Controls & Automation - Right Column Stack */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Bulb Visualizer */}
                    <motion.div variants={item} className="h-[200px]">
                        <AutoBulb
                            isOn={latestLdr?.digital_value ?? false}
                            brightness={latestLdr?.analog_value ?? 0}
                        />
                    </motion.div>

                    {/* Manual Controls */}
                    <motion.div variants={item} className="neo-card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <Zap size={18} className="text-yellow-400" />
                                <h3 className="font-bold text-white text-sm">Manual Controls</h3>
                            </div>
                            <button
                                onClick={() => setShowAddOutput(!showAddOutput)}
                                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {showAddOutput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-white/5 p-3 rounded-xl border border-white/10 mb-4 overflow-hidden"
                            >
                                <form onSubmit={handleAddOutput} className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Label"
                                        className="neo-input text-xs py-2"
                                        required
                                        value={newOutputName}
                                        onChange={e => setNewOutputName(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="GPIO"
                                            className="neo-input text-xs py-2 w-20"
                                            required
                                            value={newOutputPin}
                                            onChange={e => setNewOutputPin(e.target.value)}
                                        />
                                        <button type="submit" className="flex-1 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-500 transition-colors">Add</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {outputs.length === 0 ? (
                                <p className="text-center text-xs text-slate-600 py-8 border border-dashed border-white/5 rounded-xl">No manual switches</p>
                            ) : (
                                outputs.map(output => (
                                    <div key={output.id} className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${output.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                <Power size={14} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-xs">{output.output_name}</h4>
                                                <p className="text-[10px] text-slate-500 font-mono">PIN {output.gpio_pin}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleOutput(output)}
                                            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${output.is_active
                                                    ? 'bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                                                    : 'bg-slate-700'
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${output.is_active ? 'left-6' : 'left-1'
                                                }`} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default UnifiedDashboard;
