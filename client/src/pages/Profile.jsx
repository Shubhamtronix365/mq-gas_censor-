import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
    User, Phone, Mail, Save, Loader, Camera, Shield, Trash2, 
    Building, Briefcase, Clock, Key, LogOut, CheckCircle, 
    Activity, Plus, Settings, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const Profile = () => {
    const { user, loading: authLoading, logout, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState("profile"); // profile, sessions
    
    const [profile, setProfile] = useState({
        email: "",
        full_name: "",
        phone_number: "",
        organization: "Tronix365",
        job_title: "IoT Systems Director"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    
    // Sessions list
    const [sessions, setSessions] = useState([
        { id: 1, device: "Chrome on Windows 11", ip: "192.168.1.45", location: "Mumbai, India", current: true, time: "Active now" },
        { id: 2, device: "Safari on iPhone 15 Pro", ip: "103.241.12.98", location: "Pune, India", current: false, time: "Logged in 4 hours ago" },
        { id: 3, device: "Firefox on macOS Sequoia", ip: "172.56.21.4", location: "Delaware, USA", current: false, time: "Logged in 3 days ago" }
    ]);

    useEffect(() => {
        if (user) {
            setProfile(prev => ({
                ...prev,
                email: user.email || "",
                full_name: user.full_name || "",
                phone_number: user.phone_number || "",
                organization: user.preferences?.organization || "Tronix365",
                job_title: user.preferences?.job_title || "IoT Systems Director"
            }));
            setLoading(false);
        }
    }, [user]);

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updatedPrefs = {
                ...(user.preferences || {}),
                organization: profile.organization,
                job_title: profile.job_title
            };

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
                full_name: profile.full_name,
                phone_number: profile.phone_number,
                preferences: updatedPrefs
            });

            updateUser(response.data);
            setMessage({ type: "success", text: "Profile details updated successfully!" });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    const revokeSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        setMessage({ type: "success", text: "Session revoked successfully." });
        setTimeout(() => setMessage(null), 2000);
    };

    if (loading || authLoading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin"></div>
            </div>
        </div>
    );

    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : "US";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto pb-20 space-y-8"
        >
            {/* Header Banner */}
            <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-white/5 bg-[#0a0f1d] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-emerald-500/10 pointer-events-none" />
                <div className="relative z-10">
                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
                        My Workspace
                    </span>
                    <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
                        {profile.full_name || "IoT Administrator"}
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                        <span>Role:</span>
                        <strong className="text-white uppercase tracking-wider">{profile.job_title}</strong>
                        <span>•</span>
                        <span className="text-emerald-400 uppercase font-bold text-xs">{user?.subscription_plan ? `${user.subscription_plan} plan` : "Free Tier"}</span>
                    </p>
                </div>
            </div>

            {/* Profile Tabs Navigation */}
            <div className="flex border-b border-white/5 gap-1 select-none">
                {[
                    { id: "profile", name: "Profile Settings", icon: User },
                    { id: "sessions", name: "Security & Sessions", icon: Shield }
                ].map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition-all relative",
                                active 
                                    ? "text-violet-400 border-violet-500 bg-white/5 rounded-t-xl" 
                                    : "text-slate-400 border-transparent hover:text-white hover:bg-white/5 rounded-t-xl"
                            )}
                        >
                            <Icon size={16} />
                            {t.name}
                        </button>
                    )
                })}
            </div>

            {/* Message Alert */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "p-4 rounded-xl flex items-center gap-3 border shadow-lg backdrop-blur-md",
                        message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    )}
                >
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <span className="font-medium">{message.text}</span>
                </motion.div>
            )}

            {/* Tab Views Content */}
            <AnimatePresence mode="wait">
                {activeTab === "profile" && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Avatar / Organization summary */}
                        <div className="space-y-6">
                            <div className="neo-card p-6 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl"></div>
                                <div className="relative group mb-4">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-500 p-[3px] shadow-xl">
                                        <div className="w-full h-full bg-[#0b1329] rounded-2xl flex items-center justify-center text-3xl font-extrabold text-white">
                                            {initials}
                                        </div>
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-lg text-slate-900 shadow-md hover:bg-slate-50 transition-colors z-20">
                                        <Camera size={14} />
                                    </button>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight">{profile.full_name || "User Administrator"}</h3>
                                <p className="text-slate-400 text-xs font-semibold mt-1">{profile.job_title} @ {profile.organization}</p>
                                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                    <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                                        {user?.subscription_plan ? `${user.subscription_plan.toUpperCase()} Plan` : "FREE Plan"}
                                    </span>
                                    {user?.google_id && (
                                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                            Google SSO Verified
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="neo-card p-6 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} className="text-emerald-400" /> Plan Telemetry Limits
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold mb-1">
                                            <span className="text-slate-400">Device Quota Usage</span>
                                            <span className="text-white">{user?.devices?.length || 0} / {user?.subscription_plan === 'starter' ? '3' : user?.subscription_plan === 'professional' ? '15' : '∞'}</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, ((user?.devices?.length || 0) / (user?.subscription_plan === 'starter' ? 3 : user?.subscription_plan === 'professional' ? 15 : 100)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between border-t border-white/5 pt-3 text-xs">
                                        <span className="text-slate-400 font-semibold">Data Retention period:</span>
                                        <span className="text-white font-bold">{user?.subscription_plan === 'starter' ? '7 Days' : user?.subscription_plan === 'professional' ? '60 Days' : '365 Days'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-400 font-semibold">Support Tier:</span>
                                        <span className="text-white font-bold">{user?.subscription_plan === 'starter' ? 'Community' : user?.subscription_plan === 'professional' ? 'Priority Email' : '24/7 SLA Support'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Details */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="neo-card p-8 space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Personal & Organization Profile</h2>
                                        <p className="text-xs text-slate-400">Manage directory records and enterprise identifiers.</p>
                                    </div>
                                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-slate-400">
                                        <Settings size={18} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={14} className="text-slate-500" /></div>
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={profile.full_name}
                                                onChange={handleChange}
                                                className="neo-input pl-9"
                                                placeholder="Administrator Name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Job Title</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Briefcase size={14} className="text-slate-500" /></div>
                                            <input
                                                type="text"
                                                name="job_title"
                                                value={profile.job_title}
                                                onChange={handleChange}
                                                className="neo-input pl-9"
                                                placeholder="IoT Systems Director"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email (Immutable)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={14} className="text-slate-500" /></div>
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="neo-input pl-9 opacity-40 cursor-not-allowed border-dashed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={14} className="text-slate-500" /></div>
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                value={profile.phone_number}
                                                onChange={handleChange}
                                                className="neo-input pl-9"
                                                placeholder="+91 XXXXX XXXXX"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Organization / Company Name</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building size={14} className="text-slate-500" /></div>
                                            <input
                                                type="text"
                                                name="organization"
                                                value={profile.organization}
                                                onChange={handleChange}
                                                className="neo-input pl-9"
                                                placeholder="Company Name"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="neo-btn-primary px-8 py-3 flex items-center gap-2"
                                    >
                                        {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                                        {saving ? 'Applying...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {activeTab === "sessions" && (
                    <motion.div
                        key="sessions"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Session / Token information */}
                        <div className="space-y-6">
                            <div className="neo-card p-6 space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Shield size={16} className="text-violet-400" /> Google Connection
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Linking your account with Google SSO permits zero-password login. Secure credentials are managed by Google authentication APIs.
                                </p>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-semibold">Status:</span>
                                        {user?.google_id ? (
                                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                <CheckCircle size={12} /> Linked
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 font-semibold">Not Linked</span>
                                        )}
                                    </div>
                                    {user?.google_id && (
                                        <div className="text-[10px] text-slate-500 font-mono select-all truncate">
                                            Google Sub: {user.google_id}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Session list panel */}
                        <div className="lg:col-span-2 neo-card p-6">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Active Login Sessions</h3>
                                    <p className="text-xs text-slate-400">Track and manage active auth tokens currently issued for this account.</p>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold font-mono">
                                    {sessions.length} Session{sessions.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {sessions.map(sess => (
                                    <div 
                                        key={sess.id}
                                        className={clsx(
                                            "p-4 rounded-2xl flex justify-between items-center border transition-all",
                                            sess.current 
                                                ? "bg-white/5 border-violet-500/30" 
                                                : "bg-white/[0.01] border-white/5 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                sess.current ? "bg-violet-600/20 text-violet-400" : "bg-white/5 text-slate-400"
                                            )}>
                                                <Activity size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate flex items-center gap-2">
                                                    {sess.device}
                                                    {sess.current && (
                                                        <span className="px-2 py-0.2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black rounded-full uppercase tracking-wider">
                                                            Current
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">{sess.ip} • {sess.location} • <span className="text-slate-500">{sess.time}</span></p>
                                            </div>
                                        </div>

                                        {!sess.current && (
                                            <button 
                                                onClick={() => revokeSession(sess.id)}
                                                className="p-2 bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 rounded-xl border border-white/5 hover:border-rose-500/20 transition-all shrink-0 active:scale-95"
                                                title="Revoke session token"
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
