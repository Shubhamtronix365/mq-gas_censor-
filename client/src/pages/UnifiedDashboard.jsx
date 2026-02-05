import { useState, useEffect } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Wind, Activity, Sun, Zap, Power, Plus, Lightbulb, Key, Copy, Check } from "lucide-react";
import AutoBulb from "../components/AutoBulb";
import { clsx } from "clsx";

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

    const SensorCard = ({ title, value, unit, icon: Icon, colorClass }) => (
        <div className="card-premium p-6 flex flex-col items-center justify-center text-center hover:ring-2 hover:ring-primary/20 transition-all">
            <div className={clsx("p-4 rounded-full mb-4", colorClass)}>
                <Icon size={32} />
            </div>
            <h3 className="text-secondary text-sm font-medium uppercase tracking-wide mb-1">{title}</h3>
            <div className="text-3xl font-bold text-primary">
                {value ?? "--"} <span className="text-lg text-secondary font-normal">{unit}</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3 tracking-tight">
                        {id}
                        <span className="text-xs px-3 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200 font-bold shadow-sm">
                            COMBINED SYSTEM
                        </span>
                    </h1>
                    <p className="text-secondary mt-1 font-medium">Integrated Gas & Light Monitoring</p>
                </div>

                <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
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
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Gas Section */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                    <Wind className="text-accent" /> Gas & Environment
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SensorCard
                        title="Gas Level"
                        value={latestGas?.gas ? Number(latestGas.gas).toFixed(0) : null}
                        unit="ppm"
                        icon={Wind}
                        colorClass="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 ring-1 ring-gray-200/50"
                    />
                    <SensorCard
                        title="Temperature"
                        value={latestGas?.temperature ? Number(latestGas.temperature).toFixed(1) : null}
                        unit="°C"
                        icon={Thermometer}
                        colorClass="bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 ring-1 ring-orange-200/50"
                    />
                    <SensorCard
                        title="Humidity"
                        value={latestGas?.humidity ? Number(latestGas.humidity).toFixed(1) : null}
                        unit="%"
                        icon={Droplets}
                        colorClass="bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 ring-1 ring-blue-200/50"
                    />
                    <SensorCard
                        title="Distance"
                        value={latestGas?.distance ? Number(latestGas.distance).toFixed(1) : null}
                        unit="cm"
                        icon={Activity}
                        colorClass="bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 ring-1 ring-purple-200/50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
                {/* LDR Section */}
                <div>
                    <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                        <Sun className="text-yellow-500" /> Light & Bulb Control
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                        <div className="card-premium p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
                            <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                                <Sun size={32} />
                            </div>
                            <h3 className="text-secondary text-sm font-medium uppercase tracking-wide">Analog Reading</h3>
                            <div className="text-3xl font-bold text-primary mt-1">
                                {latestLdr?.analog_value ?? "--"} <span className="text-lg text-secondary font-normal">/ 1050</span>
                            </div>
                        </div>
                        <div className="card-premium p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50 to-white border-blue-100">
                            <div className={`p-4 rounded-full mb-4 ${latestLdr?.digital_value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Zap size={32} />
                            </div>
                            <h3 className="text-secondary text-sm font-medium uppercase tracking-wide">Digital Status</h3>
                            <div className="text-3xl font-bold text-primary mt-1">
                                {latestLdr?.digital_value ? "Active (1)" : "Inactive (0)"}
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] mb-6">
                        <AutoBulb
                            isOn={latestLdr?.digital_value ?? false}
                            brightness={latestLdr?.analog_value ?? 0}
                        />
                    </div>
                </div>

                {/* Controls & Charts */}
                <div className="flex flex-col gap-6">
                    <div className="card-premium p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-primary">Bulb Controls</h3>
                            <button
                                onClick={() => setShowAddOutput(!showAddOutput)}
                                className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors"
                                title="Add Output"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        {showAddOutput && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                <form onSubmit={handleAddOutput}>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            className="input-field flex-1"
                                            required
                                            value={newOutputName}
                                            onChange={e => setNewOutputName(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            placeholder="GPIO"
                                            className="input-field w-24"
                                            required
                                            value={newOutputPin}
                                            onChange={e => setNewOutputPin(e.target.value)}
                                        />
                                        <button type="submit" className="bg-primary text-white px-4 rounded-lg">Add</button>
                                    </div>
                                </form>
                            </div>
                        )}
                        <div className="space-y-3">
                            {outputs.length === 0 ? (
                                <p className="text-center text-sm text-secondary py-4 italic">No manual outputs configured</p>
                            ) : (
                                outputs.map(output => (
                                    <div key={output.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Power size={18} className={output.is_active ? "text-green-500" : "text-slate-400"} />
                                            <div>
                                                <h4 className="font-medium text-primary text-sm">{output.output_name}</h4>
                                                <p className="text-[10px] text-secondary font-mono">GPIO {output.gpio_pin}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleOutput(output)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${output.is_active ? 'bg-primary' : 'bg-slate-300'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${output.is_active ? 'left-6' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card-premium p-6 flex-1 min-h-[250px]">
                        <h3 className="text-lg font-bold text-primary mb-4">Gas Trends</h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={gasReadings}>
                                    <defs>
                                        <linearGradient id="colorGasCombined" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2d3436" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2d3436" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f2f6" />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis hide />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="gas" stroke="#2d3436" fill="url(#colorGasCombined)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnifiedDashboard;
