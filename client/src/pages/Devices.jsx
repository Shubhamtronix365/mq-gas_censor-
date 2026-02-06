import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Server, Activity, AlertTriangle, Trash2, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDeviceId, setNewDeviceId] = useState("");
    const [newDeviceType, setNewDeviceType] = useState("gas_sensor");
    const [showAddModal, setShowAddModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
            setDevices(response.data);
        } catch (error) {
            console.error("Error fetching devices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/devices/`, {
                device_id: newDeviceId,
                device_type: newDeviceType
            });
            setShowAddModal(false);
            setNewDeviceId("");
            setNewDeviceType("gas_sensor");
            fetchDevices();
        } catch (error) {
            alert("Failed to add device. ID might be taken.");
        }
    };

    const handleDeleteClick = (e, deviceId) => {
        e.preventDefault();
        e.stopPropagation();
        setDeviceToDelete(deviceId);
    };

    const confirmDelete = async () => {
        if (!deviceToDelete) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/devices/${deviceToDelete}`);
            fetchDevices();
            setDeviceToDelete(null);
        } catch (error) {
            console.error("Error deleting device:", error);
        }
    };

    // Card Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, scale: 0.9 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-200">Devices</h1>
                    <p className="text-slate-400 font-light text-lg">Manage your connected nodes</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="neo-btn-primary flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>Deploy Node</span>
                </motion.button>
            </div>

            {loading ? (
                <div className="flex justify-center py-40">
                    <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                </div>
            ) : devices.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-white/10 bg-white/5"
                >
                    <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                        <Server className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-medium text-white">No nodes active</h3>
                    <p className="text-slate-400 mb-8 max-w-xs text-center leading-relaxed">System is idle. Deploy your first sensor node to start monitoring.</p>
                    <button onClick={() => setShowAddModal(true)} className="neo-btn bg-slate-700 hover:bg-slate-600 text-white">
                        Deploy Now
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {devices.map((device) => (
                        <Link to={`/devices/${device.device_id}`} key={device.device_id}>
                            <motion.div
                                variants={item}
                                whileHover={{ y: -5 }}
                                className="neo-card p-6 h-full flex flex-col justify-between group"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-violet-500/30 group-hover:bg-violet-500/10 transition-colors">
                                        <Server size={24} className="text-violet-200 group-hover:text-violet-400" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, device.device_id)}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                                        {device.device_type === 'ldr_sensor' ? 'LightNode' :
                                            device.device_type === 'combined_sensor' ? 'FusionNode' : 'GasNode'}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-mono tracking-wide opacity-60 mb-4">
                                        ID: {device.device_id}
                                    </p>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                            {device.device_type === 'combined_sensor' ? 'Multi-Sensor' : 'Single Point'}
                                        </span>
                                        <Activity size={16} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </motion.div>
            )}

            {/* Delete Modal */}
            <AnimatePresence>
                {deviceToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setDeviceToDelete(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="neo-card p-8 w-full max-w-sm relative z-10 bg-[#0f172a] shadow-2xl"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 border border-rose-500/20">
                                    <AlertTriangle size={32} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white text-center mb-2">Terminating Node</h3>
                            <p className="text-slate-400 text-center mb-8 text-sm">
                                Are you sure you want to decouple <span className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">{deviceToDelete}</span>? This action is irreversible.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setDeviceToDelete(null)}
                                    className="neo-btn bg-white/5 text-white hover:bg-white/10"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="neo-btn bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/20"
                                >
                                    Terminate
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setShowAddModal(false)}
                        />
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="neo-card p-8 w-full max-w-sm relative z-10 bg-[#0f172a]"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-white">Deploy New Node</h2>
                            <form onSubmit={handleAddDevice} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Device ID</label>
                                    <input
                                        type="text"
                                        required
                                        className="neo-input"
                                        placeholder="e.g. ESP32_DELTA"
                                        value={newDeviceId}
                                        onChange={(e) => setNewDeviceId(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuration Type</label>
                                    <div className="relative">
                                        <select
                                            className="neo-input appearance-none bg-white/5 w-full pr-10"
                                            value={newDeviceType}
                                            onChange={(e) => setNewDeviceType(e.target.value)}
                                        >
                                            <option value="gas_sensor" className="bg-slate-800">Gas Sensor Node</option>
                                            <option value="ldr_sensor" className="bg-slate-800">LDR Sensor Node</option>
                                            <option value="combined_sensor" className="bg-slate-800">Fusion Node (Gas + LDR)</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="neo-btn bg-white/5 text-white hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="neo-btn-primary">
                                        Deploy
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Devices;
