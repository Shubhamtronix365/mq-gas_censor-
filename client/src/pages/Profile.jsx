import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, Save, Loader, Camera, Shield, Trash2, Building, Briefcase, Clock, Key, LogOut, CheckCircle, Activity, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

const Profile = () => {
    const { user, loading: authLoading, logout } = useAuth();
    const [profile, setProfile] = useState({
        email: "",
        full_name: "",
        phone_number: "",
        organization: "Tronix365",
        job_title: "IoT Engineer"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`);
            setProfile(prev => ({
                ...prev,
                email: response.data.email,
                full_name: response.data.full_name || "",
                phone_number: response.data.phone_number || ""
            }));
        } catch (error) {
            console.error("Error fetching profile:", error);
            setMessage({ type: "error", text: "Failed to load profile data." });
        } finally {
            setLoading(false);
        }
    };

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
            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
                full_name: profile.full_name,
                phone_number: profile.phone_number
            });

            setMessage({ type: "success", text: "Profile updated successfully!" });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
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
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-6xl mx-auto pb-20 space-y-8"
        >
            {/* Header Area */}
            <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Profile Settings</h1>
                    <p className="text-slate-400">Manage your personal identity and workspace preferences.</p>
                </div>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={clsx(
                            "px-4 py-2 rounded-xl flex items-center gap-3 border shadow-lg backdrop-blur-md",
                            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        )}
                    >
                        {message.type === 'success' ? <CheckCircle size={18} /> : <Shield size={18} />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </motion.div>
                )}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Identity Card */}
                <motion.div variants={item} className="space-y-6">
                    <div className="neo-card p-8 flex flex-col items-center text-center relative overflow-hidden group">
                        {/* Background Decor */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/30 blur-[60px] rounded-full pointer-events-none"></div>

                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full bg-[#0F172A] flex items-center justify-center text-4xl font-bold text-white border-4 border-[#1E293B] shadow-[0_0_30px_rgba(59,130,246,0.3)] relative z-10 group-hover:scale-105 transition-transform duration-500">
                                <span className="bg-gradient-to-br from-blue-400 to-violet-400 bg-clip-text text-transparent">
                                    {initials}
                                </span>
                            </div>
                            <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20"></div>
                            <button className="absolute bottom-0 right-0 p-2.5 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-500 transition-colors z-20 border border-white/10">
                                <Camera size={16} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-1">{profile.full_name || "User"}</h2>
                        <p className="text-slate-400 text-sm mb-4">{profile.job_title} @ {profile.organization}</p>

                        <div className="flex gap-2 mb-6">
                            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                Administrator
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div> Active
                            </span>
                        </div>

                        <div className="w-full pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-white">4</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Devices</span>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <span className="block text-2xl font-bold text-white">2y</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Tenure</span>
                            </div>
                        </div>
                    </div>

                    {/* Session Activity (Mock) */}
                    <div className="neo-card p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" /> Recent Activity
                        </h3>
                        <div className="space-y-4 relative">
                            {/* Timeline Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-white/5"></div>

                            {[
                                { action: "Profile Updated", time: "Just now", icon: User, color: "text-blue-400" },
                                { action: "Login from Windows", time: "2 hours ago", icon: Key, color: "text-emerald-400" },
                                { action: "Device 'Living Room' Added", time: "Yesterday", icon: Plus, color: "text-violet-400" },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 relative z-10">
                                    <div className="w-6 h-6 rounded-full bg-[#020617] border border-white/10 flex items-center justify-center shrink-0">
                                        <div className={`w-2 h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-300 font-medium">{item.action}</p>
                                        <p className="text-xs text-slate-500">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Edit Form */}
                <motion.div variants={item} className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="neo-card p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <User size={120} />
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <User size={20} className="text-blue-400" />
                                Personal Information
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">Update your basic profile details.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative group">
                                    <User size={16} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={profile.full_name}
                                        onChange={handleChange}
                                        className="neo-input pl-10 w-full"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title</label>
                                <div className="relative group">
                                    <Briefcase size={16} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        name="job_title"
                                        value={profile.job_title}
                                        onChange={handleChange}
                                        className="neo-input pl-10 w-full"
                                        placeholder="Software Engineer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="neo-input pl-10 w-full opacity-50 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Phone size={16} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={profile.phone_number}
                                        onChange={handleChange}
                                        className="neo-input pl-10 w-full"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Organization</label>
                                <div className="relative group">
                                    <Building size={16} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        name="organization"
                                        value={profile.organization}
                                        onChange={handleChange}
                                        className="neo-input pl-10 w-full"
                                        placeholder="Company Name"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-white/5">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="neo-card p-6 border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.05)]">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2">
                                    <Shield size={20} />
                                    Danger Zone
                                </h3>
                                <p className="text-xs text-rose-400/70 mt-1 max-w-md">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                            </div>
                            <button className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all text-sm flex items-center gap-2">
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Profile;
