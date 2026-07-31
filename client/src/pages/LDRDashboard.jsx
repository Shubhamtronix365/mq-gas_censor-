import { useState, useEffect } from "react";
import axios from "axios";
import { Sun, Lightbulb, Key, Copy, Check, Zap, Power, Plus, Trash2, ArrowUpRight, Sliders, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
import NodeStatusBadge from "../components/NodeStatusBadge";
import { clsx } from "clsx";

const LDRDashboard = ({ id, device }) => {
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [showAddOutput, setShowAddOutput] = useState(false);
    const [newOutputName, setNewOutputName] = useState("");
    const [newOutputPin, setNewOutputPin] = useState("");
    const [isScreenOn, setIsScreenOn] = useState(true);
    const [timeRange, setTimeRange] = useState("24h");

    useEffect(() => {
        fetchReadings();
        fetchOutputs();
        const interval = setInterval(() => {
            fetchReadings();
            fetchOutputs();
        }, 1000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchReadings = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/readings?limit=20`);
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

    const fetchOutputs = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/outputs`);
            setOutputs(response.data);
        } catch (error) {
            console.error("Error fetching outputs:", error);
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
            fetchOutputs();
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
            fetchOutputs();
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

    const intensityPct = latest?.analog_value !== undefined 
        ? Math.min(100, Math.max(0, Math.round((latest.analog_value / 4095) * 100))) 
        : 0;

    const activeLightsCount = outputs.filter(o => o.is_active).length;

    const avgIntensity = readings.length > 0
        ? Math.round(readings.reduce((sum, r) => sum + (r.analog_value || 0), 0) / readings.length)
        : (latest?.analog_value || 0);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#020617]/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-xl">
                    <p className="text-xs text-slate-400 mb-2 font-medium">{new Date(label).toLocaleTimeString()}</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <span className="text-sm font-bold text-white">
                            Intensity: {payload[0].value} / 4095
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 select-none"
        >
            {/* Header Section matching LDR SENSOR NODE interface.png */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                        <Sun size={24} className="text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            Smart Light Automation System
                        </h1>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                            Node ID: <span className="text-slate-300 font-mono font-bold">{id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                    {/* Device Token Pill */}
                    {device && (
                        <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 group">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">DEVICE TOKEN</span>
                            <Key size={13} className="text-yellow-400" />
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

                    {/* System Online Badge */}
                    <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                        <span className="text-xs font-bold text-emerald-400 tracking-wide">System Online</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Smart Light Controller (Rugged Physical Console Unit) */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <motion.div 
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} 
                        className="relative mx-auto w-full bg-gradient-to-b from-[#252830] to-[#15171c] border-4 border-[#353942] rounded-[2.5rem] p-5 md:p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(255,255,255,0.1),_inset_0_-2px_4px_rgba(0,0,0,0.5)] flex flex-col gap-5"
                    >
                        {/* Side Glowing Amber LED Light Strips */}
                        <div className="absolute top-14 bottom-14 left-0 w-1.5 bg-[#f59e0b] shadow-[0_0_15px_#f59e0b,0_0_8px_#f59e0b] rounded-r-full"></div>
                        <div className="absolute top-14 bottom-14 right-0 w-1.5 bg-[#f59e0b] shadow-[0_0_15px_#f59e0b,0_0_8px_#f59e0b] rounded-l-full"></div>

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
                                "w-28 h-2 rounded-full border border-slate-900 transition-all duration-500",
                                !isScreenOn 
                                    ? "bg-slate-800 shadow-none" 
                                    : "bg-[#f59e0b] shadow-[0_0_15px_#f59e0b,0_0_5px_#f59e0b]"
                            )}></div>
                        </div>

                        {/* LCD Recessed Screen */}
                        <div className="relative overflow-hidden bg-[#080a11] rounded-2xl border-2 border-[#16191f] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] p-6 min-h-[340px] flex flex-col justify-between transition-all duration-300">
                            {/* Subtle CRT scanlines overlay */}
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[size:100%_4px]"></div>
                            {/* Glass Reflection overlay */}
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] rounded-2xl"></div>

                            {!isScreenOn ? (
                                <div className="flex-1 flex items-center justify-center text-slate-800 font-mono text-xs tracking-widest uppercase">
                                    CONTROLLER STANDBY
                                </div>
                            ) : (
                                <>
                                    {/* Screen Header */}
                                    <div className="text-center border-b border-white/5 pb-3">
                                        <div className="text-xs font-extrabold text-slate-300 tracking-widest uppercase">SMART LIGHT</div>
                                        <div className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">CONTROLLER</div>
                                    </div>

                                    {/* Center Display Area */}
                                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                                        {/* Bulb Circle Icon */}
                                        <div className="relative w-24 h-24 rounded-full border border-yellow-500/40 bg-yellow-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.25)] group">
                                            <Lightbulb size={40} className="text-yellow-400 stroke-[2] drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-transform group-hover:scale-110 duration-300" />
                                        </div>

                                        {/* Analog Intensity Value */}
                                        <div className="text-center mt-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ANALOG INTENSITY</div>
                                            <div className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                                                {latest?.analog_value ?? "--"} <span className="text-sm font-semibold text-slate-500">/ 4095</span>
                                            </div>
                                        </div>

                                        {/* Digital Status Pill */}
                                        <div className="text-center mt-2 w-full">
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">DIGITAL STATUS</div>
                                            <div className={clsx(
                                                "w-full py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all shadow-inner",
                                                latest?.digital_value
                                                    ? "bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                                    : "bg-slate-900/90 border-white/5 text-slate-400"
                                            )}>
                                                {latest?.digital_value ? "ACTIVE (1)" : "INACTIVE (0)"}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bezel Controls */}
                        <div className="flex justify-center items-center gap-6 mt-1">
                            <button 
                                onClick={() => setIsScreenOn(prev => !prev)}
                                className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-[0_4px_6px_rgba(0,0,0,0.4)] active:scale-95",
                                    isScreenOn ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-900 text-slate-600"
                                )}
                                title="Previous"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <button 
                                onClick={() => setIsScreenOn(prev => !prev)}
                                className="w-12 h-12 rounded-full bg-gradient-to-b from-[#2d3139] to-[#1a1c20] hover:from-[#353a43] hover:to-[#22252a] border border-slate-700/60 shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                                title="Power Toggle"
                            >
                                <Power size={20} className={clsx(
                                    "transition-all duration-300",
                                    isScreenOn ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" : "text-slate-600"
                                )} />
                            </button>

                            <button 
                                onClick={() => setIsScreenOn(prev => !prev)}
                                className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border border-slate-700/60 shadow-[0_4px_6px_rgba(0,0,0,0.4)] active:scale-95",
                                    isScreenOn ? "bg-slate-800 text-slate-300 hover:text-white" : "bg-slate-900 text-slate-600"
                                )}
                                title="Next"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: Metric Cards, Controls & Trends */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-8">
                    
                    {/* TOP 3 QUICK METRIC CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        
                        {/* Card 1: Analog Intensity */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-yellow-500/20 bg-slate-900/60 hover:border-yellow-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                                    <Sun size={20} />
                                </div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">ANALOG INTENSITY</h3>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-white tracking-tight">
                                    {latest?.analog_value ?? "--"} <span className="text-sm font-semibold text-slate-500">/ 4095</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Current Light Level</p>
                            </div>
                            {/* Sparkline curve */}
                            <div className="w-full h-8 mt-2 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                                    <path d="M 0 18 Q 20 8 40 16 T 80 10 T 100 14" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </motion.div>

                        {/* Card 2: Digital Status */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-blue-500/20 bg-slate-900/60 hover:border-blue-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                    <Zap size={20} />
                                </div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">DIGITAL STATUS</h3>
                            </div>
                            <div>
                                <div className={clsx("text-2xl font-black tracking-tight", latest?.digital_value ? "text-blue-400" : "text-slate-300")}>
                                    {latest?.digital_value ? "Active (1)" : "Inactive (0)"}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">System Mode</p>
                            </div>
                            {/* Sparkline curve */}
                            <div className="w-full h-8 mt-2 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                                    <path d="M 0 14 Q 25 20 50 10 T 75 16 T 100 12" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </motion.div>

                        {/* Card 3: Manual Outputs */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-purple-500/20 bg-slate-900/60 hover:border-purple-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                    <Sliders size={20} />
                                </div>
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">MANUAL OUTPUTS</h3>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-white tracking-tight">
                                    {outputs.length}
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Configured Outputs</p>
                            </div>
                            {/* Sparkline curve */}
                            <div className="w-full h-8 mt-2 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
                                    <path d="M 0 16 Q 30 10 60 18 T 100 8" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </motion.div>
                    </div>

                    {/* MIDDLE PANEL: Manual Controls */}
                    <div className="neo-card p-6 border border-white/5 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 tracking-tight">
                                <div className="w-1.5 h-5 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                Manual Controls
                            </h2>
                            <button
                                onClick={() => setShowAddOutput(!showAddOutput)}
                                className="bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-yellow-500/30 flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus size={16} /> Add Control
                            </button>
                        </div>

                        {showAddOutput && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-slate-950/80 rounded-2xl border border-white/10">
                                <form onSubmit={handleAddOutput}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <input
                                            type="text"
                                            placeholder="Output Name (e.g. Lawn Light)"
                                            className="neo-input w-full text-xs"
                                            required
                                            value={newOutputName}
                                            onChange={e => setNewOutputName(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="GPIO Pin (e.g. 2)"
                                            className="neo-input w-full text-xs"
                                            required
                                            value={newOutputPin}
                                            onChange={e => setNewOutputPin(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setShowAddOutput(false)} className="flex-1 py-2 text-xs border border-white/10 rounded-xl text-slate-300 hover:bg-white/5">Cancel</button>
                                        <button type="submit" className="flex-1 py-2 text-xs bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors">Add</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {outputs.map((output, index) => (
                                <div 
                                    key={output.id} 
                                    className={clsx(
                                        "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                                        output.is_active 
                                            ? "border-yellow-500/40 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.15)]" 
                                            : "border-white/5 bg-slate-900/50 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "p-2.5 rounded-xl transition-colors",
                                            output.is_active ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-slate-500'
                                        )}>
                                            <Lightbulb size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white tracking-tight">{output.output_name}</h4>
                                            <p className="text-[10px] text-slate-500 font-semibold">{output.is_active ? 'On' : 'Off'}</p>
                                        </div>
                                    </div>

                                    {/* Switch Toggle */}
                                    <button
                                        onClick={() => toggleOutput(output)}
                                        className={clsx(
                                            "w-11 h-6 rounded-full transition-all duration-300 relative border cursor-pointer",
                                            output.is_active ? 'bg-yellow-500/30 border-yellow-500/60' : 'bg-white/5 border-white/10'
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                            output.is_active ? 'left-6 bg-yellow-400 shadow-[0_0_8px_#f59e0b]' : 'left-1 bg-slate-500'
                                        )}></div>
                                    </button>
                                </div>
                            ))}

                            {/* Add New Output Card */}
                            <div 
                                onClick={() => setShowAddOutput(true)}
                                className="p-4 rounded-2xl border border-dashed border-white/10 bg-slate-900/20 hover:bg-slate-900/60 hover:border-yellow-500/30 cursor-pointer transition-all flex items-center justify-center gap-2 group text-slate-400 hover:text-yellow-400"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-yellow-500/20 transition-colors">
                                    <Plus size={18} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider">Add New</span>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM DUAL GRID: Trends Chart & System Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Light Intensity Trends */}
                        <div className="lg:col-span-7 neo-card p-6 h-[380px] flex flex-col justify-between">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                                    <div className="w-1.5 h-5 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                    Light Intensity Trends
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
                                            <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
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
                                            domain={[0, 4095]}
                                            stroke="#475569"
                                            tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(234,179,8,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="analog_value"
                                            name="Intensity"
                                            stroke="#eab308"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorLight)"
                                            animationDuration={1000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* System Overview Arc Gauge */}
                        <div className="lg:col-span-5 neo-card p-6 h-[380px] flex flex-col justify-between">
                            <h3 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-5 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                System Overview
                            </h3>

                            {/* Arc Gauge */}
                            <div className="relative flex flex-col items-center justify-center py-2">
                                <svg className="w-48 h-28 overflow-visible" viewBox="0 0 140 80">
                                    <defs>
                                        <linearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#eab308" />
                                            <stop offset="100%" stopColor="#f59e0b" />
                                        </linearGradient>
                                        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <path
                                        d="M 10 70 A 60 60 0 0 1 130 70"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.08)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M 10 70 A 60 60 0 0 1 130 70"
                                        fill="none"
                                        stroke="url(#arcGlow)"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={Math.PI * 60}
                                        strokeDashoffset={(Math.PI * 60) - (intensityPct / 100) * (Math.PI * 60)}
                                        filter="url(#glowEffect)"
                                        className="transition-all duration-500 ease-out"
                                    />
                                </svg>
                                <div className="absolute bottom-2 flex flex-col items-center">
                                    <span className="text-3xl font-black text-white tracking-tight">{latest?.analog_value !== undefined ? `${intensityPct}%` : "--%"}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Current Intensity</span>
                                </div>
                            </div>

                            {/* Bottom Stat Counters */}
                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-2xl font-black text-yellow-400">{activeLightsCount}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active Lights</div>
                                </div>
                                <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-2xl font-black text-white">{avgIntensity}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Avg Intensity</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default LDRDashboard;
