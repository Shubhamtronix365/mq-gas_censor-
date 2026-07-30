import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Key, Copy, Check, Zap, ArrowUpRight, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const EnergyMeterDashboard = ({ id, device }) => {
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    
    // UI Simulator States
    const [displayMode, setDisplayMode] = useState(0); // 0: kWh, 1: kW (Load), 2: Volts, 3: Amps
    const [activePhase, setActivePhase] = useState(0);
    const [buttonPressed, setButtonPressed] = useState(null);

    useEffect(() => {
        fetchReadings();
        const interval = setInterval(fetchReadings, 5000);
        return () => clearInterval(interval);
    }, [id]);

    // Phase LED animation to simulate load activity
    useEffect(() => {
        const interval = setInterval(() => {
            setActivePhase((prev) => (prev + 1) % 3);
        }, 600);
        return () => clearInterval(interval);
    }, []);

    const fetchReadings = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${id}/readings?limit=20`);
            const data = response.data.reverse();
            setReadings(data);
            if (data.length > 0) {
                setLatest(data[data.length - 1]);
            }
        } catch (error) {
            console.error("Error fetching energy readings:", error);
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

    // Formatter to match Schneider's space-separated layout: e.g. "104 859.712"
    const formatSchneiderKWh = (val) => {
        if (val === undefined || val === null) return "104 859.712"; // Default mockup fallback
        const fixedVal = Number(val).toFixed(3); // 3 decimal places
        const parts = fixedVal.split(".");
        const beforeDecimal = parts[0];
        const decimalPart = parts[1];
        
        // Add a space to separate thousands, millions, etc.
        // e.g. "104859" -> "104 859"
        const formattedBefore = beforeDecimal.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return `${formattedBefore}.${decimalPart}`;
    };

    const handlePressButton = (btn) => {
        setButtonPressed(btn);
        setTimeout(() => setButtonPressed(null), 150);

        if (btn === 'UP') {
            setDisplayMode((prev) => (prev > 0 ? prev - 1 : 3));
        } else if (btn === 'DOWN') {
            setDisplayMode((prev) => (prev < 3 ? prev + 1 : 0));
        } else if (btn === 'ESC') {
            setDisplayMode(0); // Return to default kWh
        } else if (btn === 'OK') {
            // Flash display mode briefly or accept settings
            alert(`EasyLogic EM1X00: Menu mode ${displayMode} Selected`);
        }
    };

    const getDisplayContent = () => {
        const kwhValue = latest?.kwh ?? 104859.712;
        switch (displayMode) {
            case 0: // kWh
                return {
                    value: formatSchneiderKWh(kwhValue),
                    label: "k W h",
                    title: "Active Energy"
                };
            case 1: // kW Load
                // Simulate a active load based on recent reading or default to 18.45 kW
                const loadVal = latest?.gas ? (latest.gas / 20.0).toFixed(2) : "18.45"; 
                return {
                    value: `   ${loadVal}`,
                    label: "k W",
                    title: "Active Power Demand"
                };
            case 2: // Voltage
                return {
                    value: "230.4  229.8", // simulated line-to-line or phase V
                    label: "V  L-N",
                    title: "Average Phase Voltage"
                };
            case 3: // Current
                return {
                    value: "   45.22",
                    label: "A",
                    title: "Average Current Load"
                };
            default:
                return { value: "104 859.712", label: "k W h", title: "Active Energy" };
        }
    };

    const display = getDisplayContent();

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
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        <span className="text-sm font-bold text-white">
                            Energy: {Number(payload[0].value).toFixed(3)} kWh
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
            className="space-y-8 pb-10"
        >
            {/* Header Section */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        {id}
                        <span className="text-xs px-3 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            ENERGY METER ACTIVE
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                        <Activity size={16} className="text-emerald-400" />
                        Industrial Three-Phase Power Monitoring
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
                    <div className="text-xs font-bold text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-wider">
                        Last telemetry: <span className="text-white ml-2">{latest ? new Date(latest.timestamp).toLocaleTimeString() : "--:--:--"}</span>
                    </div>
                    {device && (
                        <div className="bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto flex items-center gap-2 pr-4 transition-all hover:bg-white/10 group">
                            <div className="bg-white/5 px-3 py-2 rounded-lg border-r border-white/5">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device Token</p>
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Key size={14} className="text-emerald-400 shrink-0" />
                                <code className="text-xs font-mono text-white select-all truncate opacity-80 group-hover:opacity-100 transition-opacity">{device.device_token}</code>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white relative"
                                title="Copy Token"
                            >
                                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Grid Layout: physical Schneider simulator on left, graphs & indicators on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Physical Bezel Container: occupies 5 columns */}
                <div className="lg:col-span-5 flex flex-col justify-center items-center">
                    
                    {/* Mounting Panel Mimicking green wall in photo */}
                    <div className="w-full max-w-[390px] p-8 rounded-3xl bg-[#34c749]/90 border-4 border-slate-900/40 shadow-inner flex justify-center items-center relative overflow-hidden group">
                        
                        {/* Screws on panel corner for authenticity */}
                        <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-700 shadow-md flex items-center justify-center"><div className="w-2.5 h-0.5 bg-zinc-800 rotate-45"></div></div>
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-700 shadow-md flex items-center justify-center"><div className="w-2.5 h-0.5 bg-zinc-800 -rotate-45"></div></div>
                        <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-700 shadow-md flex items-center justify-center"><div className="w-2.5 h-0.5 bg-zinc-800 -rotate-12"></div></div>
                        <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-700 shadow-md flex items-center justify-center"><div className="w-2.5 h-0.5 bg-zinc-800 rotate-12"></div></div>

                        {/* Physical Meter Body */}
                        <div className="w-full aspect-square max-w-[320px] bg-gradient-to-b from-[#27272a] to-[#0c0c0e] rounded-[18px] border-[5px] border-[#374151] shadow-2xl p-5 flex flex-col justify-between items-center relative select-none">
                            
                            {/* EN 19N Label */}
                            <div className="absolute top-2 left-4 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                EasyLogic™
                            </div>

                            {/* Phase LEDs & Brackets */}
                            <div className="w-full flex justify-center items-center gap-6 mt-1 mb-1">
                                {[0, 1, 2].map((idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        {/* Pulser glowing circle */}
                                        <div className={clsx(
                                            "w-2.5 h-2.5 rounded-full border border-black/40 transition-all duration-300",
                                            activePhase === idx 
                                                ? "bg-emerald-400 shadow-[0_0_10px_#10b981,0_0_20px_#10b981]" 
                                                : "bg-emerald-950/70"
                                        )}></div>
                                        <span className="text-[9px] font-bold text-zinc-400 mt-1 font-mono">
                                            L{idx + 1}
                                        </span>
                                        <div className="w-6 h-0.5 bg-zinc-600/50 mt-0.5"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Digital LCD screen with internal shadow and glass shine */}
                            <div className="w-full h-24 bg-gradient-to-br from-[#8fa597] to-[#7f9486] rounded-md border-2 border-slate-950/70 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)] p-3 flex flex-col justify-between relative overflow-hidden">
                                
                                {/* LCD Screen Gloss Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>

                                {/* Top Display title (Shows active measurement mode) */}
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-800/80 font-mono uppercase tracking-wider">
                                    <span>{display.title}</span>
                                    <span>NOMINAL</span>
                                </div>

                                {/* Main Value Text (Retro digital monospace look) */}
                                <div className="text-2xl font-bold font-mono tracking-widest text-[#0e1f18] text-right font-extrabold pr-1 select-all select-none">
                                    {display.value}
                                </div>

                                {/* Bottom labels */}
                                <div className="flex justify-between items-end">
                                    {/* Display Mode Indicator */}
                                    <span className="text-[8px] font-bold text-slate-800/60 font-mono">
                                        M0{displayMode}
                                    </span>
                                    
                                    {/* Units */}
                                    <span className="text-xs font-bold text-[#0e1f18] tracking-widest lowercase">
                                        {display.label}
                                    </span>
                                </div>
                            </div>

                            {/* Buttons Bezel */}
                            <div className="w-full flex justify-between items-center px-2 mt-2 mb-2">
                                {[
                                    { name: 'ESC', label: 'ESC' },
                                    { name: 'UP', label: '▲' },
                                    { name: 'DOWN', label: '▼' },
                                    { name: 'OK', label: 'OK' }
                                ].map((btn) => (
                                    <button
                                        key={btn.name}
                                        onClick={() => handlePressButton(btn.name)}
                                        className={clsx(
                                            "w-10 h-10 rounded-full flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all shadow-md active:translate-y-0.5",
                                            buttonPressed === btn.name 
                                                ? "bg-zinc-400 border-zinc-600 scale-95 shadow-inner" 
                                                : "bg-gradient-to-b from-[#d4d4d8] to-[#9ca3af] hover:from-zinc-100 hover:to-zinc-300 border-zinc-500 text-zinc-950"
                                        )}
                                    >
                                        <span>{btn.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Schneider Electric Logo and Model */}
                            <div className="w-full flex justify-between items-center border-t border-zinc-700/60 pt-2.5 px-1">
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black text-white uppercase tracking-tight">
                                        Schneider
                                    </span>
                                    <span className="text-[9px] font-bold text-[#34c749] tracking-wide mt-[-2px]">
                                        Electric
                                    </span>
                                </div>
                                <div className="text-[8px] text-zinc-400 font-medium">
                                    EM1X00 LCD
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information cards & statistics: occupies 7 columns */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Cumulative Energy Card */}
                        <div className="neo-card p-5 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-3 border border-emerald-500/20">
                                <Zap size={20} />
                            </div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Cumulative Energy</h4>
                            <div className="text-3xl font-extrabold text-white mt-1.5 flex items-baseline gap-1.5">
                                {latest?.kwh ? Number(latest.kwh).toFixed(3) : "104859.712"}{" "}
                                <span className="text-base text-slate-500 font-medium uppercase">kWh</span>
                            </div>
                        </div>

                        {/* Estimated Average Load */}
                        <div className="neo-card p-5 border-violet-500/20 hover:border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                            <div className="p-3 bg-violet-600/10 text-violet-400 rounded-xl w-fit mb-3 border border-violet-500/20">
                                <Cpu size={20} />
                            </div>
                            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estimated Load Rate</h4>
                            <div className="text-3xl font-extrabold text-white mt-1.5 flex items-baseline gap-1.5">
                                {latest?.gas ? (latest.gas / 20.0).toFixed(2) : "18.45"}{" "}
                                <span className="text-base text-slate-500 font-medium">kW</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Manual Instructions */}
                    <div className="neo-card p-5 bg-white/5 border-white/5 flex gap-4 items-start">
                        <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg border border-yellow-500/20 shrink-0">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1">Interactive LCD Console</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Click the physical buttons on the EasyLogic meter screen to swap display variables:
                                <span className="block mt-1.5 text-[11px] font-mono text-emerald-300">
                                    • <strong>UP / DOWN</strong>: Toggle between Cumulative Energy (kWh), Active Load (kW), Line Voltage (V), and Line Amps (A).
                                </span>
                                <span className="block text-[11px] font-mono text-emerald-300">
                                    • <strong>ESC</strong>: Return to default Active Energy (kWh).
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Live Chart Section */}
            <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="neo-card p-6 h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        Energy Consumption History (kWh)
                    </h3>
                    <div className="p-2 bg-white/5 rounded-lg text-slate-400">
                        <ArrowUpRight size={18} />
                    </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                    {readings.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                            No telemetry history found. Send data from device to plot.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorKWh" x1="0" y1="0" x2="0" y2="1">
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
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    domain={['auto', 'auto']}
                                    tickFormatter={(v) => Number(v).toFixed(1)}
                                    tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.5)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="kwh"
                                    name="Energy Level"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorKWh)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default EnergyMeterDashboard;
