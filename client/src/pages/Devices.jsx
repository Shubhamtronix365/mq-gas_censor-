import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Server, Activity, AlertTriangle, Trash2, ChevronDown, Zap, Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import NodeStatusBadge from "../components/NodeStatusBadge";

// Mirror of backend PLAN_DEVICE_LIMITS — kept in sync
const PLAN_DEVICE_LIMITS = {
    free:         2,
    starter:      5,
    professional: 15,
    enterprise:   100,
};

const PLAN_LABELS = {
    free:         "Free Tier",
    starter:      "Starter Basic",
    professional: "Pro Control Center",
    enterprise:   "Enterprise Grid",
};

const getPlanLimit = (plan) => PLAN_DEVICE_LIMITS[(plan || "free").toLowerCase()] ?? 2;
const getPlanLabel = (plan) => PLAN_LABELS[(plan || "free").toLowerCase()] ?? "Free Tier";

const Devices = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [devices, setDevices]           = useState([]);
    const [limitInfo, setLimitInfo]       = useState(null);
    const [loading, setLoading]           = useState(true);
    const [newDeviceId, setNewDeviceId]   = useState("");
    const [newDeviceType, setNewDeviceType] = useState("gas_sensor");
    const [showAddModal, setShowAddModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [addError, setAddError]         = useState("");
    const [addLoading, setAddLoading]     = useState(false);

    useEffect(() => {
        fetchDevices();
        fetchLimitInfo();
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

    const fetchLimitInfo = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/limit-info`);
            setLimitInfo(response.data);
        } catch (error) {
            // Compute locally from user context as fallback
            const plan = (user?.subscription_plan || "free").toLowerCase();
            const limit = getPlanLimit(plan);
            setLimitInfo({ plan, limit, used: devices.length, remaining: limit - devices.length, at_limit: devices.length >= limit });
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        setAddError("");
        setAddLoading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/devices/`, {
                device_id: newDeviceId,
                device_type: newDeviceType
            });
            setShowAddModal(false);
            setNewDeviceId("");
            setNewDeviceType("gas_sensor");
            await Promise.all([fetchDevices(), fetchLimitInfo()]);
        } catch (error) {
            const detail = error.response?.data?.detail || "Failed to add device. ID might be taken.";
            setAddError(detail);
        } finally {
            setAddLoading(false);
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
            await Promise.all([fetchDevices(), fetchLimitInfo()]);
            setDeviceToDelete(null);
        } catch (error) {
            console.error("Error deleting device:", error);
        }
    };

    // Derived limit data
    const plan       = limitInfo?.plan  || (user?.subscription_plan || "free").toLowerCase();
    const maxNodes   = limitInfo?.limit || getPlanLimit(plan);
    const usedNodes  = limitInfo?.used  || devices.length;
    const atLimit    = usedNodes >= maxNodes;
    const fillPct    = Math.min(100, Math.round((usedNodes / maxNodes) * 100));
    const barColor   = fillPct >= 100 ? "bg-rose-500" : fillPct >= 80 ? "bg-amber-500" : "bg-emerald-500";

    // Card Variants
    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item      = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } };

    return (
        <div className="relative">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-200">Devices</h1>
                    <p className="text-slate-400 font-light text-lg">Manage your connected nodes</p>
                </div>
                <motion.button
                    whileHover={{ scale: atLimit ? 1 : 1.05 }}
                    whileTap={{ scale: atLimit ? 1 : 0.95 }}
                    onClick={() => atLimit ? navigate("/subscription") : setShowAddModal(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        atLimit
                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 cursor-not-allowed"
                            : "neo-btn-primary"
                    }`}
                >
                    {atLimit ? <><Lock size={16} /> Limit Reached</> : <><Plus size={18} /><span>Deploy Node</span></>}
                </motion.button>
            </div>

            {/* Plan Usage Bar */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-5 rounded-2xl bg-white/3 border border-white/8 backdrop-blur-sm"
            >
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <Server size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Node Usage</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-black ${atLimit ? "text-rose-400" : "text-slate-300"}`}>
                            {usedNodes} / {maxNodes} nodes
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 text-violet-400">
                            {getPlanLabel(plan)}
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fillPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${barColor} shadow-[0_0_8px_currentColor]`}
                    />
                </div>

                {atLimit && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-3 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-1.5 text-xs text-rose-400">
                            <ShieldAlert size={13} />
                            <span>Node limit reached for your current plan.</span>
                        </div>
                        <button
                            onClick={() => navigate("/subscription")}
                            className="flex items-center gap-1 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
                        >
                            Upgrade Plan <ArrowRight size={12} />
                        </button>
                    </motion.div>
                )}
            </motion.div>

            {/* Device Grid */}
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
                                        <NodeStatusBadge device={device} />
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
                                        {device.device_type === 'ldr_sensor'        ? 'LightNode' :
                                         device.device_type === 'combined_sensor'   ? 'FusionNode' :
                                         device.device_type === 'air_quality_monitor' ? 'AirQualityNode' :
                                         device.device_type === 'energy_meter'      ? 'Energy Meter' : 'GasNode'}
                                    </h3>
                                    <p className="text-sm text-slate-400 font-mono tracking-wide opacity-60 mb-4">
                                        ID: {device.device_id}
                                    </p>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                                            {device.device_type === 'combined_sensor' || device.device_type === 'air_quality_monitor' ? 'Multi-Sensor' :
                                             device.device_type === 'energy_meter' ? 'Power Monitor' : 'Single Point'}
                                        </span>
                                        <Activity size={16} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}

                    {/* "Add Node" placeholder card — only shown when not at limit */}
                    {!atLimit && (
                        <motion.div
                            variants={item}
                            whileHover={{ y: -5, borderColor: "rgba(139,92,246,0.4)" }}
                            onClick={() => setShowAddModal(true)}
                            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 bg-white/3 cursor-pointer min-h-[180px] gap-3 transition-all group"
                        >
                            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 group-hover:bg-violet-500/20 transition-colors">
                                <Plus size={24} className="text-violet-400" />
                            </div>
                            <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">Deploy Node</span>
                            <span className="text-xs text-slate-600">{usedNodes}/{maxNodes} slots used</span>
                        </motion.div>
                    )}
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
                                <button onClick={() => setDeviceToDelete(null)} className="neo-btn bg-white/5 text-white hover:bg-white/10">Cancel</button>
                                <button onClick={confirmDelete} className="neo-btn bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-900/20">Terminate</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Node Modal */}
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
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                                    <Zap size={20} className="text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Deploy New Node</h2>
                                    <p className="text-xs text-slate-500">{usedNodes}/{maxNodes} slots used · {getPlanLabel(plan)}</p>
                                </div>
                            </div>

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
                                        autoFocus
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
                                            <option value="gas_sensor"          className="bg-slate-800">Gas Sensor Node</option>
                                            <option value="ldr_sensor"          className="bg-slate-800">LDR Sensor Node</option>
                                            <option value="combined_sensor"     className="bg-slate-800">Fusion Node (Gas + LDR)</option>
                                            <option value="air_quality_monitor" className="bg-slate-800">Air Quality Monitoring</option>
                                            <option value="energy_meter"        className="bg-slate-800">Energy Meter</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Error display */}
                                {addError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 leading-relaxed"
                                    >
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <span>{addError}</span>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddModal(false); setAddError(""); }}
                                        className="neo-btn bg-white/5 text-white hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addLoading}
                                        className="neo-btn-primary disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {addLoading ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : "Deploy"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Limit-reached upgrade banner — shown at bottom when at limit with devices present */}
            <AnimatePresence>
                {atLimit && devices.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 to-rose-600/10 border border-violet-500/20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 shrink-0">
                                <Lock size={18} className="text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Node limit reached ({usedNodes}/{maxNodes})</p>
                                <p className="text-xs text-slate-400">Your <span className="text-violet-300 font-semibold">{getPlanLabel(plan)}</span> plan supports up to {maxNodes} nodes. Upgrade to add more.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/subscription")}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-600/25"
                        >
                            <Zap size={14} /> Upgrade Plan
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Devices;
