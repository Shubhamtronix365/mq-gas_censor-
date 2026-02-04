import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Key, Copy, Check, Edit3 } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { clsx } from 'clsx';
import { useAuth } from "../context/AuthContext";
import IconPickerSidebar from "../components/IconPickerSidebar";

const GasDashboard = ({ id, device }) => { // Accept id and device as props
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
            navigator.clipboard.writeText(device.device_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "DANGER": return "text-danger bg-red-50 border-red-100";
            case "WARNING": return "text-warning bg-yellow-50 border-yellow-100";
            default: return "text-safe bg-green-50 border-green-100";
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

    const SensorCard = ({ title, value, unit, defaultIcon: DefaultIcon, colorClass, type }) => {
        const Icon = getSensorIcon(type, DefaultIcon);
        return (
            <div
                onClick={() => handleSensorClick(type)}
                className="card-premium p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all group relative"
            >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-primary hover:bg-white shadow-sm">
                        <Edit3 size={14} />
                    </div>
                </div>
                <div className={clsx("p-4 rounded-full mb-4 transition-transform group-hover:scale-110 duration-300", colorClass)}>
                    <Icon size={32} />
                </div>
                <h3 className="text-secondary text-sm font-medium uppercase tracking-wide mb-1">{title}</h3>
                <div className="text-3xl font-bold text-primary">
                    {value ?? "--"} <span className="text-lg text-secondary font-normal">{unit}</span>
                </div>
            </div>
        );
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-100 shadow-xl">
                    <p className="text-xs text-secondary mb-2 font-medium">{new Date(label).toLocaleTimeString()}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-sm font-semibold text-primary">
                                {entry.name}: {Number(entry.value).toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3 tracking-tight">
                        {id}
                        {latest && (
                            <span className={clsx("text-xs px-3 py-1 rounded-full border bg-white/50 backdrop-blur font-bold shadow-sm", getStatusColor(latest.status))}>
                                {latest.status}
                            </span>
                        )}
                    </h1>
                    <p className="text-secondary mt-1 font-medium">Real-time gas & environment monitoring</p>
                </div>

                <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
                    <div className="text-sm text-secondary font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                        Last updated: {latest ? new Date(latest.timestamp).toLocaleTimeString() : "--:--:--"}
                    </div>
                    {device && (
                        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto flex items-center gap-2 pr-4 transition-all hover:shadow-md">
                            <div className="bg-slate-50 px-3 py-2 rounded-lg border-r border-slate-100">
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Device Token</p>
                            </div>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Key size={14} className="text-accent shrink-0" />
                                <code className="text-xs font-mono text-primary select-all truncate">{device.device_token}</code>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-secondary hover:text-primary relative group"
                                title="Copy"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    Copy Token
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sensor Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SensorCard
                    title="Gas Level"
                    value={latest?.gas ? Number(latest.gas).toFixed(0) : null}
                    unit="ppm"
                    defaultIcon={Wind}
                    type="Gas"
                    colorClass="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 ring-1 ring-gray-200/50"
                />
                <SensorCard
                    title="Temperature"
                    value={latest?.temperature ? Number(latest.temperature).toFixed(1) : null}
                    unit="°C"
                    defaultIcon={Thermometer}
                    type="Temperature"
                    colorClass="bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 ring-1 ring-orange-200/50"
                />
                <SensorCard
                    title="Humidity"
                    value={latest?.humidity ? Number(latest.humidity).toFixed(1) : null}
                    unit="%"
                    defaultIcon={Droplets}
                    type="Humidity"
                    colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 ring-1 ring-blue-200/50"
                />
                <SensorCard
                    title="Distance"
                    value={latest?.distance ? Number(latest.distance).toFixed(1) : null}
                    unit="cm"
                    defaultIcon={Activity}
                    type="Distance"
                    colorClass="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 ring-1 ring-purple-200/50"
                />
            </div>

            <IconPickerSidebar
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                sensorType={activeSensor}
                currentIcon={user?.preferences?.[`icon_${activeSensor}`]}
                onSelectIcon={handleIconSelect}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card-premium p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <div className="w-2 h-6 bg-accent rounded-full"></div>
                            Gas Trends
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2d3436" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2d3436" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f2f6" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="gas"
                                    name="Gas Level"
                                    stroke="#2d3436"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorGas)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card-premium p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <div className="w-2 h-6 bg-orange-500 rounded-full"></div>
                            Environment
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={readings}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e17055" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#e17055" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0984e3" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#0984e3" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f2f6" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11, fontWeight: 500 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="temperature"
                                    name="Temp (°C)"
                                    stroke="#e17055"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTemp)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="humidity"
                                    name="Humidity (%)"
                                    stroke="#0984e3"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorHum)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GasDashboard;
