import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
    User, Shield, Settings, Clock, Mail, Phone, MapPin, Edit2, 
    Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Trash2, Globe, Key, ChevronRight, LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const Profile = () => {
    const { user, loading: authLoading, updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("profile"); // profile, security, preferences, activity

    // Form states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("+91 98765 43210");
    const [location, setLocation] = useState("Mumbai, India");
    const [timezone, setTimezone] = useState("Asia/Kolkata (GMT +05:30)");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Feedback states
    const [saving, setSaving] = useState(false);
    const [passSaving, setPassSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || "Admin User");
            setEmail(user.email || "admin@indianiiot.com");
            setPhone(user.phone_number || "+91 98765 43210");
            if (user.preferences?.location) setLocation(user.preferences.location);
            if (user.preferences?.timezone) setTimezone(user.preferences.timezone);
        }
    }, [user]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updatedPrefs = {
                ...(user.preferences || {}),
                location,
                timezone
            };

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
                full_name: fullName,
                phone_number: phone,
                preferences: updatedPrefs
            });

            updateUser(response.data);
            setMessage({ type: "success", text: "Profile details updated successfully!" });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "Failed to update profile details." });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }
        setPassSaving(true);
        setMessage(null);

        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/change-password`, {
                current_password: currentPassword,
                new_password: newPassword
            });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setMessage({ type: "success", text: "Password changed successfully!" });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            const detail = error.response?.data?.detail || "Failed to update password.";
            setMessage({ type: "error", text: detail });
        } finally {
            setPassSaving(false);
        }
    };

    const initials = fullName
        ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : "A";

    const memberSinceStr = user?.created_at 
        ? "Member since " + new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : "Member since 15 Jan 2025";

    return (
        <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
            
            {/* BREADCRUMB & HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">My Profile</h1>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                        <span>Dashboard</span>
                        <ChevronRight size={12} className="text-slate-600" />
                        <span className="text-purple-400 font-semibold">Profile</span>
                    </p>
                </div>
            </div>

            {/* Notification Toast Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={clsx(
                            "p-4 rounded-xl border flex items-center justify-between text-xs font-bold",
                            message.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        )}
                    >
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TOP PROFILE BANNER CARD matching profile session.png */}
            <div className="neo-card p-6 md:p-8 border border-purple-500/20 bg-slate-900/70 shadow-2xl rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                
                {/* Left: Avatar & Identity info */}
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-slate-950 p-1 border-2 border-gradient-to-tr from-purple-500 to-cyan-400 shadow-[0_0_25px_rgba(168,85,247,0.3)] flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] flex items-center justify-center text-3xl font-black text-white">
                                {initials}
                            </div>
                        </div>
                        {/* Green Glowing Online Dot */}
                        <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_10px_#10b981]"></div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white tracking-tight">{fullName || "Admin User"}</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                                Verified <CheckCircle2 size={12} />
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{email}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                                <MapPin size={13} className="text-purple-400" /> {location}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className="flex items-center gap-1">
                                <Clock size={13} className="text-cyan-400" /> {memberSinceStr}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Account Security Widget */}
                <div className="p-4 px-6 bg-slate-950/60 rounded-2xl border border-white/10 flex items-center gap-5 w-full lg:w-auto">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account Security</h4>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">Your account is secure</p>
                        <button 
                            onClick={() => setActiveTab("security")}
                            className="mt-2 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            Security Settings <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION BAR matching profile session.png */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("profile")}
                    className={clsx(
                        "px-5 py-3 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap",
                        activeTab === "profile"
                            ? "border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-white"
                    )}
                >
                    <User size={15} /> Profile Information
                </button>

                <button
                    onClick={() => setActiveTab("security")}
                    className={clsx(
                        "px-5 py-3 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap",
                        activeTab === "security"
                            ? "border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-white"
                    )}
                >
                    <Shield size={15} /> Security
                </button>

                <button
                    onClick={() => setActiveTab("preferences")}
                    className={clsx(
                        "px-5 py-3 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap",
                        activeTab === "preferences"
                            ? "border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-white"
                    )}
                >
                    <Settings size={15} /> Preferences
                </button>

                <button
                    onClick={() => setActiveTab("activity")}
                    className={clsx(
                        "px-5 py-3 text-xs font-bold transition-all duration-200 flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap",
                        activeTab === "activity"
                            ? "border-purple-500 text-purple-300 bg-purple-500/10 rounded-t-xl"
                            : "border-transparent text-slate-400 hover:text-white"
                    )}
                >
                    <Clock size={15} /> Activity Logs
                </button>
            </div>

            {/* TAB CONTENT 1: PROFILE INFORMATION matching profile session.png */}
            {activeTab === "profile" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: Personal Information Form (7 cols) */}
                        <div className="lg:col-span-7 neo-card p-6 border border-white/10 bg-slate-900/60 space-y-5">
                            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Personal Information</h3>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            required
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition-all pr-10"
                                        />
                                        <Edit2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-400 outline-none cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Location</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Timezone</label>
                                    <input
                                        type="text"
                                        value={timezone}
                                        onChange={e => setTimezone(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full mt-2 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/25 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? "Saving Changes..." : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        {/* RIGHT COLUMN: Change Password & Connected Accounts (5 cols) */}
                        <div className="lg:col-span-5 space-y-6">
                            
                            {/* Change Password Card */}
                            <div className="neo-card p-6 border border-white/10 bg-slate-900/60 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Lock size={16} className="text-purple-400" />
                                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Change Password</h3>
                                </div>

                                <form onSubmit={handlePasswordUpdate} className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPass ? "text" : "password"}
                                                placeholder="Enter current password"
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                required
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500 transition-all pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPass(!showCurrentPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNewPass ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                required
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500 transition-all pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPass(!showNewPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPass ? "text" : "password"}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                required
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-purple-500 transition-all pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                {showConfirmPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={passSaving}
                                        className="w-full mt-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {passSaving ? "Updating..." : "Update Password"}
                                    </button>
                                </form>
                            </div>

                            {/* Connected Accounts Card */}
                            <div className="neo-card p-6 border border-white/10 bg-slate-900/60 space-y-3">
                                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Connected Accounts</h3>
                                
                                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {/* Google Icon */}
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white font-bold">
                                            G
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white">Google</div>
                                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{email}</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* BOTTOM DANGER ZONE CARD matching profile session.png */}
                    <div className="neo-card p-6 border border-rose-500/20 bg-rose-950/10 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-extrabold text-rose-400">Danger Zone</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Once you delete your account, there is no going back.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => alert("Account deletion requires admin confirmation.")}
                            className="px-5 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 2: SECURITY */}
            {activeTab === "security" && (
                <div className="neo-card p-6 border border-white/10 bg-slate-900/60 space-y-6">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Security & Authentication</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="text-xs font-bold text-white">Two-Factor Authentication (2FA)</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Add an extra layer of security using Google Authenticator.</p>
                            </div>
                            <button className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                                Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: PREFERENCES */}
            {activeTab === "preferences" && (
                <div className="neo-card p-6 border border-white/10 bg-slate-900/60 space-y-6">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Account Preferences</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 flex justify-between items-center">
                            <div>
                                <h4 className="text-xs font-bold text-white">Email Notifications</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Receive alert warnings and daily telemetry summaries.</p>
                            </div>
                            <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-500 cursor-pointer" />
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 4: ACTIVITY LOGS */}
            {activeTab === "activity" && (
                <div className="neo-card p-6 border border-white/10 bg-slate-900/60 space-y-4">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">System Activity Logs</h3>
                    <div className="space-y-2">
                        <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-medium">Logged in from Chrome on Windows 11</span>
                            <span className="text-slate-500 font-mono text-[10px]">Just now</span>
                        </div>
                        <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-medium">Air Quality Node #02 deployed</span>
                            <span className="text-slate-500 font-mono text-[10px]">2 hours ago</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
