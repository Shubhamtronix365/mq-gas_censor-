import { useState, useEffect } from "react";
import axios from "axios";
import { 
    BarChart2, Database, Bell, Clock, Calendar, Filter, Download, 
    ChevronRight, ArrowUpRight, Info, Monitor, Cpu, Zap, Sun, Droplets, ArrowUp, ArrowDown, Wifi, Wind
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { clsx } from "clsx";

const Analytics = () => {
    const [chartType, setChartType] = useState("Line Chart");
    const [trendTimeRange, setTrendTimeRange] = useState("This Week");
    const [loading, setLoading] = useState(false);

    // Sample multi-metric sensor trend data matching analytics dashbaord.png
    const sensorTrendData = [
        { date: "May 16", temperature: 28.5, humidity: 48, aqi: 24 },
        { date: "May 17", temperature: 32.0, gas: 390, humidity: 52, aqi: 28 },
        { date: "May 18", temperature: 29.8, gas: 360, humidity: 58, aqi: 32 },
        { date: "May 19", temperature: 32.6, gas: 420, humidity: 56, aqi: 38 },
        { date: "May 20", temperature: 36.4, gas: 510, humidity: 62, aqi: 45 },
        { date: "May 21", temperature: 30.2, gas: 440, humidity: 50, aqi: 34 },
        { date: "May 22", temperature: 34.8, gas: 480, humidity: 54, aqi: 40 }
    ];

    // Donut chart distribution data matching analytics dashbaord.png
    const pieData = [
        { name: "Temperature", value: 40, count: "9.9K", color: "#3b82f6" },
        { name: "Humidity", value: 25, count: "6.2K", color: "#a855f7" },
        { name: "Air Quality", value: 20, count: "5.0K", color: "#10b981" },
        { name: "Energy", value: 10, count: "2.5K", color: "#f59e0b" },
        { name: "Others", value: 5, count: "1.2K", color: "#06b6d4" }
    ];

    // Alerts summary bar chart data
    const alertsData = [
        { severity: "High", count: 12, color: "#ef4444" },
        { severity: "Medium", count: 24, color: "#f59e0b" },
        { severity: "Low", count: 8, color: "#eab308" },
        { severity: "Info", count: 5, color: "#3b82f6" }
    ];

    // Data points heatmap matrix data (7 days x 7 time slots)
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "12 AM"];

    // Generate gradient intensity values for matrix
    const getMatrixIntensityClass = (dayIdx, timeIdx) => {
        const val = ((dayIdx * 3 + timeIdx * 5) % 10);
        if (val > 7) return "bg-emerald-400 opacity-90";
        if (val > 5) return "bg-teal-500 opacity-80";
        if (val > 3) return "bg-blue-500 opacity-70";
        if (val > 1) return "bg-indigo-600 opacity-60";
        return "bg-slate-800 opacity-40";
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const CustomTrendTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#080d1a]/95 backdrop-blur-md p-3.5 rounded-xl border border-white/10 shadow-2xl min-w-[170px]">
                    <p className="text-xs text-slate-400 font-medium mb-2 border-b border-white/5 pb-1">{label}, 2025 10:30 AM</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0 text-xs">
                            <span className="font-bold text-slate-300">{entry.name}:</span>
                            <span className="font-bold font-mono" style={{ color: entry.color }}>
                                {entry.value} {entry.name.includes("Temperature") ? "°C" : entry.name.includes("Humidity") ? "%" : "AQI"}
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
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 select-none max-w-[1920px] mx-auto pb-16"
        >
            {/* HEADER BAR matching analytics dashbaord.png */}
            <motion.div variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Analytics</h1>
                    <p className="text-xs text-slate-400 font-medium mt-1">Insights and trends from your IoT ecosystem</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Picker Pill */}
                    <div className="bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold text-slate-300">
                        <span>May 16 – May 22, 2025</span>
                        <Calendar size={14} className="text-blue-400" />
                    </div>

                    {/* Filter Icon Button */}
                    <button className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer" title="Filters">
                        <Filter size={15} />
                    </button>

                    {/* Export Report Button */}
                    <button 
                        onClick={() => alert("Generating & downloading telemetry CSV analytics report...")}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                    >
                        <Download size={14} /> Export Report
                    </button>
                </div>
            </motion.div>

            {/* TOP 4 STATS BENTO CARDS GRID matching analytics dashbaord.png */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Card 1: Total Devices */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-blue-500/20 bg-slate-900/60 hover:border-blue-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <Monitor size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Devices</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">8</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <ArrowUp size={12} /> 14% vs last week
                            </span>
                            {/* Blue Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 16 Q 15 6 30 14 T 50 4" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 2: Data Points */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-emerald-500/20 bg-slate-900/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <Database size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Points</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">24.8K</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <ArrowUp size={12} /> 23% vs last week
                            </span>
                            {/* Green Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 18 Q 15 10 30 15 T 50 8" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 3: Alerts Triggered */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-purple-500/20 bg-slate-900/60 hover:border-purple-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Bell size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alerts Triggered</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">12</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <ArrowDown size={12} /> 20% vs last week
                            </span>
                            {/* Purple Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 14 Q 20 18 35 8 T 50 12" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 4: Avg. Uptime */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-5 border border-amber-500/20 bg-slate-900/60 hover:border-amber-500/40 transition-all flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <Clock size={22} />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Uptime</div>
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white tracking-tight">99.4%</div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <ArrowUp size={12} /> 3.2% vs last week
                            </span>
                            {/* Amber Sparkline SVG */}
                            <div className="w-16 h-6 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                                <svg className="w-full h-full" viewBox="0 0 50 20" preserveAspectRatio="none">
                                    <path d="M 0 16 Q 15 6 30 12 T 50 4" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* MIDDLE ROW: SENSOR DATA TREND & DATA POINTS OVERVIEW matching analytics dashbaord.png */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT: Sensor Data Trend (8 Cols) */}
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="lg:col-span-8 neo-card p-6 border border-blue-500/20 bg-slate-900/60 flex flex-col justify-between min-h-[420px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-extrabold text-white">Sensor Data Trend</h2>
                            <Info size={14} className="text-slate-500 cursor-pointer" />
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <div className="flex items-center gap-1.5 text-blue-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Temperature (°C)
                            </div>
                            <div className="flex items-center gap-1.5 text-purple-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Humidity (%)
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Air Quality (AQI)
                            </div>

                            <select
                                value={chartType}
                                onChange={e => setChartType(e.target.value)}
                                className="bg-slate-950 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl px-3 py-1.5 outline-none cursor-pointer ml-2"
                            >
                                <option value="Line Chart">Line Chart</option>
                                <option value="Area Chart">Area Chart</option>
                            </select>
                        </div>
                    </div>

                    {/* Chart Container */}
                    <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === "Area Chart" ? (
                                <AreaChart data={sensorTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip content={<CustomTrendTooltip />} />
                                    <Area type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#3b82f6" strokeWidth={2.5} fill="#3b82f6" fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#a855f7" strokeWidth={2.5} fill="#a855f7" fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="aqi" name="Air Quality (AQI)" stroke="#10b981" strokeWidth={2.5} fill="#10b981" fillOpacity={0.2} />
                                </AreaChart>
                            ) : (
                                <LineChart data={sensorTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 11, fontWeight: 500, fill: '#64748b' }} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip content={<CustomTrendTooltip />} />
                                    <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
                                    <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#a855f7" strokeWidth={2.5} dot={{ fill: '#a855f7', r: 4 }} />
                                    <Line type="monotone" dataKey="aqi" name="Air Quality (AQI)" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* RIGHT: Data Points Overview Donut Chart (4 Cols) */}
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="lg:col-span-4 neo-card p-6 border border-blue-500/20 bg-slate-900/60 flex flex-col justify-between min-h-[420px]">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-base font-extrabold text-white">Data Points Overview</h2>
                        <select
                            value={trendTimeRange}
                            onChange={e => setTrendTimeRange(e.target.value)}
                            className="bg-slate-950 border border-white/10 text-slate-300 text-xs font-semibold rounded-xl px-2.5 py-1 outline-none cursor-pointer"
                        >
                            <option value="This Week">This Week</option>
                            <option value="This Month">This Month</option>
                        </select>
                    </div>

                    {/* Donut Chart & Legend Stack */}
                    <div className="flex flex-col items-center justify-center my-auto relative">
                        <div className="w-48 h-48 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                                <span className="text-xl font-black text-white">24.8K</span>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                            </div>
                        </div>

                        {/* Donut Legend Items */}
                        <div className="w-full space-y-1.5 mt-2">
                            {pieData.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs font-medium px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-slate-300">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-white">{item.value}% <span className="text-slate-500 font-normal">({item.count})</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* BOTTOM ROW: DEVICE PERFORMANCE, ALERTS SUMMARY, & HEATMAP matching analytics dashbaord.png */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* 1. Device Performance Progress Cards */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-6 border border-white/10 bg-slate-900/60 flex flex-col justify-between h-full min-h-[340px]">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                Device Performance <Info size={13} className="text-slate-500" />
                            </h3>
                        </div>

                        <div className="space-y-3.5">
                            {/* Device 1 */}
                            <div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                                    <span className="flex items-center gap-2">
                                        <Wifi size={14} className="text-emerald-400" /> ESP32 - Node 01
                                    </span>
                                    <span className="font-mono text-white">98%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }}></div>
                                </div>
                            </div>

                            {/* Device 2 */}
                            <div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                                    <span className="flex items-center gap-2">
                                        <Droplets size={14} className="text-cyan-400" /> Air Quality - 02
                                    </span>
                                    <span className="font-mono text-white">95%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '95%' }}></div>
                                </div>
                            </div>

                            {/* Device 3 */}
                            <div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                                    <span className="flex items-center gap-2">
                                        <Zap size={14} className="text-purple-400" /> Energy Meter - 01
                                    </span>
                                    <span className="font-mono text-white">92%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '92%' }}></div>
                                </div>
                            </div>

                            {/* Device 4 */}
                            <div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                                    <span className="flex items-center gap-2">
                                        <Sun size={14} className="text-amber-400" /> LDR Node - 03
                                    </span>
                                    <span className="font-mono text-white">78%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }}></div>
                                </div>
                            </div>

                            {/* Device 5 */}
                            <div>
                                <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-1">
                                    <span className="flex items-center gap-2">
                                        <Wind size={14} className="text-rose-400" /> Gas Sensor - 04
                                    </span>
                                    <span className="font-mono text-white">65%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Link to="/devices" className="mt-4 pt-3 border-t border-white/5 text-xs text-blue-400 font-bold flex items-center justify-center gap-1 hover:underline">
                        View All Devices <ArrowUpRight size={14} />
                    </Link>
                </motion.div>

                {/* 2. Alerts Summary Bar Chart */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-6 border border-white/10 bg-slate-900/60 flex flex-col justify-between h-full min-h-[340px]">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                Alerts Summary <Info size={13} className="text-slate-500" />
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">This Week</span>
                        </div>

                        {/* Bar Chart */}
                        <div className="w-full h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={alertsData}>
                                    <XAxis dataKey="severity" stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {alertsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <Link to="/devices" className="mt-4 pt-3 border-t border-white/5 text-xs text-blue-400 font-bold flex items-center justify-center gap-1 hover:underline">
                        View All Alerts <ArrowUpRight size={14} />
                    </Link>
                </motion.div>

                {/* 3. Data Points Heatmap Grid */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="neo-card p-6 border border-white/10 bg-slate-900/60 flex flex-col justify-between h-full min-h-[340px]">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                Data Points Heatmap <Info size={13} className="text-slate-500" />
                            </h3>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">This Week</span>
                        </div>

                        {/* Heatmap Grid Matrix */}
                        <div className="space-y-1.5">
                            {days.map((day, dIdx) => (
                                <div key={day} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                    <span className="w-7 text-right">{day}</span>
                                    <div className="grid grid-cols-7 gap-1 flex-1">
                                        {times.map((t, tIdx) => (
                                            <div
                                                key={tIdx}
                                                className={clsx(
                                                    "h-4 rounded-sm transition-all hover:scale-110",
                                                    getMatrixIntensityClass(dIdx, tIdx)
                                                )}
                                                title={`${day} ${t}: High Data Density`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom X-Axis Times */}
                        <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500 pl-8.5 mt-2 justify-between">
                            {times.map(t => <span key={t}>{t}</span>)}
                        </div>
                    </div>

                    {/* Gradient Bar Legend */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span>Low</span>
                        <div className="w-32 h-1.5 rounded-full bg-gradient-to-r from-slate-800 via-blue-500 to-emerald-400"></div>
                        <span>High</span>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default Analytics;
