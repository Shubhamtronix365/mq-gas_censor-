import { useState, useEffect } from "react";
import axios from "axios";
import { 
    Plus, Server, Activity, AlertTriangle, Trash2, ChevronDown, Zap, Lock, ShieldAlert, 
    ArrowRight, Search, X, Filter, CheckSquare, Square, ListChecks, Download, Check 
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
    const [searchParams, setSearchParams] = useSearchParams();
    const searchFilter = (searchParams.get("search") || "").trim();

    const [devices, setDevices]           = useState([]);
    const [limitInfo, setLimitInfo]       = useState(null);
    const [loading, setLoading]           = useState(true);
    const [newDeviceId, setNewDeviceId]   = useState("");
    const [newDeviceType, setNewDeviceType] = useState("gas_sensor");
    const [showAddModal, setShowAddModal] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState(null);
    const [addError, setAddError]         = useState("");
    const [addLoading, setAddLoading]     = useState(false);

    // Multi-select state
    const [selectionMode, setSelectionMode]   = useState(false);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
    const [batchDeleting, setBatchDeleting]   = useState(false);

    useEffect(() => {
        fetchDevices();
        fetchLimitInfo();
    }, []);

    const fetchDevices = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
            setDevices(response.data || []);
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
            const targetId = encodeURIComponent(deviceToDelete.trim());
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/devices/${targetId}`);
            await Promise.all([fetchDevices(), fetchLimitInfo()]);
            setDeviceToDelete(null);
            setSelectedDevices(prev => prev.filter(id => id !== deviceToDelete));
        } catch (error) {
            console.error("Error deleting device:", error);
        }
    };

    // Filter devices based on URL search query
    const q = searchFilter.toLowerCase();
    const filteredDevices = devices.filter((device) => {
        if (!q) return true;
        const typeLabel = (
            device.device_type === 'ldr_sensor' ? 'LightNode light sensor' :
            device.device_type === 'combined_sensor' ? 'FusionNode multi sensor unified' :
            device.device_type === 'air_quality_monitor' ? 'AirQualityNode AQI monitor environment' :
            device.device_type === 'energy_meter' ? 'Energy Meter power load' : 'GasNode gas sensor'
        ).toLowerCase();
        const idStr = (device.device_id || "").toLowerCase();
        const typeStr = (device.device_type || "").toLowerCase();
        const statusStr = device.is_online ? "online active" : "offline inactive";

        return idStr.includes(q) || typeStr.includes(q) || typeLabel.includes(q) || statusStr.includes(q);
    });

    const handleSearchChange = (val) => {
        if (val.trim()) {
            setSearchParams({ search: val });
        } else {
            setSearchParams({});
        }
    };

    // Multi-Select Handlers
    const toggleSelectNode = (deviceId, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSelectedDevices(prev => 
            prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
        );
    };

    const toggleSelectAll = () => {
        const visibleIds = filteredDevices.map(d => d.device_id);
        const allSelected = visibleIds.every(id => selectedDevices.includes(id));
        if (allSelected) {
            setSelectedDevices(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedDevices(prev => Array.from(new Set([...prev, ...visibleIds])));
        }
    };

    const confirmBatchDelete = async () => {
        if (selectedDevices.length === 0) return;
        setBatchDeleting(true);
        try {
            await Promise.all(
                selectedDevices.map(id => {
                    const targetId = encodeURIComponent(id.trim());
                    return axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/devices/${targetId}`).catch(err => console.error(err));
                })
            );
            setSelectedDevices([]);
            setShowBatchDeleteModal(false);
            await Promise.all([fetchDevices(), fetchLimitInfo()]);
        } catch (error) {
            console.error("Error batch deleting devices:", error);
        } finally {
            setBatchDeleting(false);
        }
    };

    const exportSelectedCSV = () => {
        const selectedObjList = devices.filter(d => selectedDevices.includes(d.device_id));
        if (!selectedObjList.length) return;

        const headers = "device_id,device_type,is_online,created_at,last_seen\n";
        const rows = selectedObjList.map(d => 
            `"${d.device_id}","${d.device_type}",${d.is_online},"${d.created_at || ''}","${d.last_seen || ''}"`
        ).join("\n");

        const blob = new Blob([headers + rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `selected_devices_export_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Derived limit data
    const plan       = limitInfo?.plan  || (user?.subscription_plan || "free").toLowerCase();
    const maxNodes   = limitInfo?.limit || getPlanLimit(plan);
    const usedNodes  = limitInfo?.used  || devices.length;
    const atLimit    = usedNodes >= maxNodes;
    const fillPct    = Math.min(100, Math.round((usedNodes / maxNodes) * 100));
    const barColor   = fillPct >= 100 ? "bg-rose-500" : fillPct >= 80 ? "bg-amber-500" : "bg-emerald-500";

    const allVisibleSelected = filteredDevices.length > 0 && filteredDevices.every(d => selectedDevices.includes(d.device_id));

    // Card Variants
    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const item      = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } };

    return (
        <div className="relative pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-200 flex items-center gap-3">
                        Devices
                        {selectionMode && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                                Multi-Select Mode
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-400 font-light text-lg">Manage your connected nodes</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Inline Page Search Filter */}
                    <div className="relative w-full sm:w-60">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter devices..."
                            value={searchFilter}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50 transition-all"
                        />
                        {searchFilter && (
                            <button
                                onClick={() => setSearchParams({})}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Multi-Select Toggle Button */}
                    <button
                        onClick={() => {
                            setSelectionMode(!selectionMode);
                            if (selectionMode) setSelectedDevices([]);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectionMode
                                ? "bg-violet-600 text-white border-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                    >
                        <ListChecks size={16} />
                        <span>{selectionMode ? "Exit Select Mode" : "Select Nodes"}</span>
                    </button>

                    {/* Select All Button when in selection mode */}
                    {selectionMode && filteredDevices.length > 0 && (
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
                        >
                            {allVisibleSelected ? <CheckSquare size={15} className="text-violet-400" /> : <Square size={15} />}
                            <span>{allVisibleSelected ? "Deselect All" : "Select All"}</span>
                        </button>
                    )}

                    <motion.button
                        whileHover={{ scale: atLimit ? 1 : 1.05 }}
                        whileTap={{ scale: atLimit ? 1 : 0.95 }}
                        onClick={() => atLimit ? navigate("/subscription") : setShowAddModal(true)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shrink-0 transition-all ${
                            atLimit
                                ? "bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 cursor-not-allowed"
                                : "neo-btn-primary"
                        }`}
                    >
                        {atLimit ? <><Lock size={15} /> Limit Reached</> : <><Plus size={16} /><span>Deploy Node</span></>}
                    </motion.button>
                </div>
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
                        {searchFilter && (
                            <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                                <Filter size={10} /> Filter: "{searchFilter}" ({filteredDevices.length}/{devices.length})
                            </span>
                        )}
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
            ) : filteredDevices.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed border-white/10 bg-white/5 text-center p-6"
                >
                    <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-400">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">No nodes match your filter</h3>
                    <p className="text-slate-400 mb-6 max-w-sm text-sm">
                        No registered nodes match search query <code className="text-violet-300 font-mono font-bold bg-white/5 px-2 py-0.5 rounded">"{searchFilter}"</code>.
                    </p>
                    <button
                        onClick={() => setSearchParams({})}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                    >
                        <X size={14} /> Clear Search Filter
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredDevices.map((device) => {
                        const isSelected = selectedDevices.includes(device.device_id);

                        return (
                            <motion.div
                                key={device.device_id}
                                variants={item}
                                whileHover={{ y: -5 }}
                                onClick={(e) => {
                                    if (selectionMode) {
                                        toggleSelectNode(device.device_id, e);
                                    } else {
                                        navigate(`/devices/${device.device_id}`);
                                    }
                                }}
                                className={`neo-card p-6 h-full flex flex-col justify-between group relative transition-all cursor-pointer ${
                                    isSelected
                                        ? "border-2 border-violet-500 bg-violet-500/15 shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                                        : "hover:border-violet-500/30"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        {/* Checkbox in selection mode */}
                                        {selectionMode ? (
                                            <button
                                                type="button"
                                                onClick={(e) => toggleSelectNode(device.device_id, e)}
                                                className={`p-1.5 rounded-lg border transition-all ${
                                                    isSelected
                                                        ? "bg-violet-600 border-violet-400 text-white shadow-md"
                                                        : "bg-slate-900 border-white/20 text-slate-500 hover:border-violet-400"
                                                }`}
                                            >
                                                {isSelected ? <Check size={16} /> : <Square size={16} />}
                                            </button>
                                        ) : (
                                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-violet-500/30 group-hover:bg-violet-500/10 transition-colors">
                                                <Server size={24} className="text-violet-200 group-hover:text-violet-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 z-10">
                                        <NodeStatusBadge device={device} />
                                        <button
                                            type="button"
                                            onClick={(e) => handleDeleteClick(e, device.device_id)}
                                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer"
                                            title="Delete Node"
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
                        );
                    })}

                    {/* "Add Node" placeholder card — only shown when not at limit */}
                    {!atLimit && !selectionMode && (
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

            {/* FLOATING BATCH ACTIONS CONTROL BAR */}
            <AnimatePresence>
                {selectionMode && selectedDevices.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-6 inset-x-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-40 bg-[#080d1a]/95 backdrop-blur-2xl border border-violet-500/40 p-4 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center font-bold text-xs text-violet-300">
                                {selectedDevices.length}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white leading-none">
                                    {selectedDevices.length} {selectedDevices.length === 1 ? "Node" : "Nodes"} Selected
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Manage or perform batch operations</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportSelectedCSV}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
                                title="Export Selected Nodes CSV"
                            >
                                <Download size={14} /> Export CSV
                            </button>

                            <button
                                onClick={() => setShowBatchDeleteModal(true)}
                                className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                                <Trash2 size={14} /> Delete ({selectedDevices.length})
                            </button>

                            <button
                                onClick={() => setSelectedDevices([])}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                                title="Clear Selection"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Single Delete Modal */}
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
                            <h3 className="text-xl font-bold text-white text-center mb-2">Delete Device Node</h3>
                            <p className="text-slate-400 text-sm text-center mb-6 leading-relaxed">
                                Are you sure you want to remove device <code className="text-rose-400 font-mono font-bold">{deviceToDelete}</code>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeviceToDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* BATCH DELETE CONFIRMATION MODAL */}
            <AnimatePresence>
                {showBatchDeleteModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/75 backdrop-blur-md"
                            onClick={() => !batchDeleting && setShowBatchDeleteModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="neo-card p-8 w-full max-w-md relative z-10 bg-[#0f172a] shadow-2xl border border-rose-500/30"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-rose-500/10 rounded-full text-rose-500 border border-rose-500/20 animate-pulse">
                                    <AlertTriangle size={36} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white text-center mb-2">Delete {selectedDevices.length} Selected Nodes</h3>
                            <p className="text-slate-400 text-sm text-center mb-4 leading-relaxed">
                                You are about to permanently delete <strong className="text-rose-400">{selectedDevices.length} node instances</strong>. All telemetry and sensor data will be permanently removed.
                            </p>
                            <div className="max-h-32 overflow-y-auto bg-black/40 p-3 rounded-xl border border-white/5 mb-6 text-xs text-slate-300 font-mono space-y-1">
                                {selectedDevices.map(id => (
                                    <div key={id} className="flex items-center gap-2">
                                        <Trash2 size={12} className="text-rose-400" />
                                        <span>{id}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    disabled={batchDeleting}
                                    onClick={() => setShowBatchDeleteModal(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={batchDeleting}
                                    onClick={confirmBatchDelete}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {batchDeleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete {selectedDevices.length} Nodes</span>
                                    )}
                                </button>
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
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="neo-card p-8 w-full max-w-md relative z-10 bg-[#0f172a] shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="text-violet-400" /> Deploy New Sensor Node
                                </h3>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {addError && (
                                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
                                    {addError}
                                </div>
                            )}

                            <form onSubmit={handleAddDevice} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Device ID</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. node_gas_01"
                                        value={newDeviceId}
                                        onChange={(e) => setNewDeviceId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Device Type</label>
                                    <select
                                        value={newDeviceType}
                                        onChange={(e) => setNewDeviceType(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                                    >
                                        <option value="gas_sensor">Gas Sensor Node</option>
                                        <option value="air_quality_monitor">Air Quality Monitor</option>
                                        <option value="ldr_sensor">Light / LDR Sensor Node</option>
                                        <option value="energy_meter">Energy Meter Node</option>
                                        <option value="combined_sensor">FusionNode (Multi-Sensor)</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addLoading}
                                        className="flex-1 py-2.5 rounded-xl neo-btn-primary font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {addLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Deploying...</span>
                                            </>
                                        ) : (
                                            <span>Deploy Node</span>
                                        )}
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
