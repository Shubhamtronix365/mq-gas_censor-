import { useState, useEffect } from "react";
import axios from "axios";
import { Sun, Lightbulb, Key, Copy, Check, Zap, Power, Plus, Trash2, ArrowUpRight } from "lucide-react";
import AutoBulb from "../components/AutoBulb";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
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
            const data = response.data.reverse(); // Recharts needs ascending time usually, or we control it. Let's reverse for chronological.
            setReadings(data);
            if (data.length > 0) {
                setLatest(data[data.length - 1]);
            }
        } catch (error) {
            console.error("Error fetching readings:", error);
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
                            Intensity: {payload[0].value}
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
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        {id}
                        <span className="text-xs px-3 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-bold shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            LDR SENSOR
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                        <Sun size={16} className="text-yellow-400" />
                        Smart Light Automation System
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
                                <Key size={14} className="text-yellow-400 shrink-0" />
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics & Visualization */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-6 flex flex-col items-center justify-center text-center border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.05)] hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] transition-all">
                            <div className="p-4 rounded-full bg-yellow-500/20 text-yellow-400 mb-4 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                <Sun size={32} />
                            </div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Analog Intensity</h3>
                            <div className="text-3xl font-bold text-white mt-1">
                                {latest?.analog_value ?? "--"} <span className="text-lg text-slate-500 font-medium">/ 4095</span>
                            </div>
                        </motion.div>

                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className={clsx(
                            "neo-card p-6 flex flex-col items-center justify-center text-center transition-all",
                            latest?.digital_value ? "border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)]" : "border-white/5"
                        )}>
                            <div className={clsx(
                                "p-4 rounded-full mb-4 transition-colors duration-300",
                                latest?.digital_value ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 text-slate-500'
                            )}>
                                <Zap size={32} />
                            </div>
                            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Digital Status</h3>
                            <div className={clsx("text-3xl font-bold mt-1", latest?.digital_value ? "text-blue-400" : "text-slate-500")}>
                                {latest?.digital_value ? "Active (1)" : "Inactive (0)"}
                            </div>
                        </motion.div>
                    </div>

                    {/* Light Trends Chart */}
                    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="neo-card p-6 h-[350px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                Light Intensity Trends
                            </h3>
                            <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                                <ArrowUpRight size={18} />
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={readings}>
                                    <defs>
                                        <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
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
                                        name="Light"
                                        stroke="#eab308"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorLight)"
                                        animationDuration={1000}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: Controls */}
                <div className="space-y-6">
                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Manual Controls</h2>
                        <button
                            onClick={() => setShowAddOutput(!showAddOutput)}
                            className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 p-2 rounded-lg transition-colors border border-yellow-500/20"
                            title="Add Output"
                        >
                            <Plus size={20} />
                        </button>
                    </motion.div>

                    {showAddOutput && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="neo-card p-4">
                            <form onSubmit={handleAddOutput}>
                                <input
                                    type="text"
                                    placeholder="Output Name (e.g. Lawn Light)"
                                    className="neo-input mb-3 w-full"
                                    required
                                    value={newOutputName}
                                    onChange={e => setNewOutputName(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="GPIO Pin"
                                    className="neo-input mb-3 w-full"
                                    required
                                    value={newOutputPin}
                                    onChange={e => setNewOutputPin(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowAddOutput(false)} className="flex-1 py-2 text-sm border border-white/10 rounded-lg text-slate-300 hover:bg-white/5">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 text-sm bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400">Add</button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="grid grid-cols-1 gap-4">
                        {outputs.length === 0 ? (
                            <div className="neo-card p-8 flex flex-col items-center justify-center text-slate-500">
                                <Lightbulb className="mb-2 opacity-50" size={32} />
                                <p>No outputs configured</p>
                            </div>
                        ) : (
                            outputs.map(output => (
                                <div key={output.id} className="neo-card p-4 flex items-center justify-between group hover:border-yellow-500/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "p-3 rounded-xl transition-colors",
                                            output.is_active ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-white/5 text-slate-500'
                                        )}>
                                            <Power size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{output.output_name}</h4>
                                            <p className="text-xs text-slate-500 font-mono">GPIO {output.gpio_pin}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleOutput(output)}
                                        className={clsx(
                                            "w-12 h-6 rounded-full transition-all duration-300 relative border",
                                            output.is_active ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-white/5 border-white/10'
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                                            output.is_active ? 'left-7 bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'left-1 bg-slate-500'
                                        )}></div>
                                    </button>
                                </div>
                            ))
                        )}
                    </motion.div>
                </div>
            </div>

            {/* AutoBulb Visualization (Optional - keeping if useful but styling could be tricky if it's external) */}
            <div className="h-[200px] hidden">
                {/* Hidden for now unless we redesign AutoBulb explicitly */}
                <AutoBulb isOn={latest?.digital_value ?? false} brightness={latest?.analog_value ?? 0} />
            </div>
        </motion.div>
    );
};

export default LDRDashboard;
