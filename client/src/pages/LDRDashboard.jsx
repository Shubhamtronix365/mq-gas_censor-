import { useState, useEffect } from "react";
import axios from "axios";
import { Sun, Lightbulb, Key, Copy, Check, Zap, Power, Plus } from "lucide-react";
import AutoBulb from "../components/AutoBulb";

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
            fetchOutputs(); // Poll outputs too for sync
        }, 2000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchReadings = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/ldr/${id}/readings?limit=20`);
            const data = response.data; // Already sorted desc by backend usually
            setReadings(data);
            if (data.length > 0) {
                setLatest(data[0]);
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
            fetchOutputs(); // Revert on error
        }
    };

    const copyToClipboard = () => {
        if (device?.device_token) {
            navigator.clipboard.writeText(device.device_token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary flex items-center gap-3 tracking-tight">
                        {id}
                        <span className="text-xs px-3 py-1 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 font-bold shadow-sm">
                            LDR SENSOR
                        </span>
                    </h1>
                    <p className="text-secondary mt-1 font-medium">Smart Light Automation System</p>
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
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Sensor Status & Auto Bulb (2/3 width on LG) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="card-premium p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
                            <div className="p-4 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                                <Sun size={32} />
                            </div>
                            <h3 className="text-secondary text-sm font-medium uppercase tracking-wide">Analog Reading</h3>
                            <div className="text-3xl font-bold text-primary mt-1">
                                {latest?.analog_value ?? "--"} <span className="text-lg text-secondary font-normal">/ 1050</span>
                            </div>
                        </div>

                        <div className="card-premium p-6 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50 to-white border-blue-100">
                            <div className={`p-4 rounded-full mb-4 ${latest?.digital_value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Zap size={32} />
                            </div>
                            <h3 className="text-secondary text-sm font-medium uppercase tracking-wide">Digital Status</h3>
                            <div className="text-3xl font-bold text-primary mt-1">
                                {latest?.digital_value ? "Active (1)" : "Inactive (0)"}
                            </div>
                        </div>
                    </div>

                    {/* Auto Bulb Visualization */}
                    <div className="h-[400px]">
                        <AutoBulb
                            isOn={latest?.digital_value ?? false}
                            brightness={latest?.analog_value ?? 0}
                        />
                    </div>
                </div>

                {/* Right Column: Manual Controls (1/3 width) */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-primary">Manual Controls</h2>
                        <button
                            onClick={() => setShowAddOutput(!showAddOutput)}
                            className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg transition-colors"
                            title="Add Output"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    {showAddOutput && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4">
                            <form onSubmit={handleAddOutput}>
                                <input
                                    type="text"
                                    placeholder="Output Name (e.g. Bulb 2)"
                                    className="input-field mb-3"
                                    required
                                    value={newOutputName}
                                    onChange={e => setNewOutputName(e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="GPIO Pin"
                                    className="input-field mb-3"
                                    required
                                    value={newOutputPin}
                                    onChange={e => setNewOutputPin(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setShowAddOutput(false)} className="flex-1 py-2 text-sm border rounded-lg">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 text-sm bg-primary text-white rounded-lg">Add</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                        {outputs.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-secondary">
                                <Lightbulb className="mx-auto mb-2 opacity-50" />
                                <p>No manual outputs configured</p>
                            </div>
                        ) : (
                            outputs.map(output => (
                                <div key={output.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${output.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Power size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary">{output.output_name}</h4>
                                            <p className="text-xs text-secondary font-mono">GPIO {output.gpio_pin}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => toggleOutput(output)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${output.is_active ? 'bg-primary' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${output.is_active ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LDRDashboard;
