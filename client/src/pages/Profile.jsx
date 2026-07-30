import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { 
    User, Phone, Mail, Save, Loader, Camera, Shield, Trash2, 
    Building, Briefcase, Clock, Key, LogOut, CheckCircle, 
    Activity, Plus, Settings, CreditCard, Globe, Layers, 
    Cpu, Zap, Check, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

const Profile = () => {
    const { user, loading: authLoading, logout, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState("profile"); // profile, billing, sessions
    const [currency, setCurrency] = useState(user?.subscription_currency || "INR"); // INR, USD
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // Parse payment callbacks on redirect landing
    useEffect(() => {
        const paymentStatus = searchParams.get("payment");
        const txnid = searchParams.get("txnid");
        const plan = searchParams.get("plan");
        const reason = searchParams.get("reason");
        
        if (paymentStatus === "success") {
            setMessage({ type: "success", text: `Payment successful! Upgraded to the ${plan?.toUpperCase()} Plan (TXN: ${txnid}).` });
            setSearchParams({});
        } else if (paymentStatus === "failure") {
            setMessage({ type: "error", text: `Payment failed for transaction ${txnid}. Please try again.` });
            setSearchParams({});
        } else if (paymentStatus === "error") {
            setMessage({ type: "error", text: `Payment validation error: ${reason || "unknown error"}` });
            setSearchParams({});
        }
    }, [searchParams]);
    
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
            setCurrency(user.subscription_currency || "INR");
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

    const submitUpgrade = async (planId) => {
        setIsUpgrading(true);
        setSelectedPlan(planId);
        setMessage(null);

        try {
            // Initiate PayU Payment Gateway session
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/payment/initiate`, {
                plan_id: planId,
                currency: currency
            });

            const paymentData = response.data;

            // Dynamically construct and submit the PayU standard redirect form POST
            const form = document.createElement("form");
            form.method = "POST";
            form.action = paymentData.payu_url;

            for (const key in paymentData) {
                if (key !== "payu_url") {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = key;
                    input.value = paymentData[key];
                    form.appendChild(input);
                }
            }

            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            console.error("Failed to initiate PayU payment", error);
            setMessage({ type: "error", text: "Failed to connect to PayU Gateway. Please try again." });
            setIsUpgrading(false);
        }
    };

    const submitCancellation = async () => {
        setIsCancelling(true);
        setMessage(null);

        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me/subscription`, {
                subscription_plan: "free",
                subscription_status: "inactive",
                subscription_currency: "INR",
                subscription_expiry: null
            });

            updateUser(response.data);
            setIsCancelModalOpen(false);
            setMessage({ type: "success", text: "Subscription cancelled successfully. Account downgraded to Free plan." });
            setTimeout(() => setMessage(null), 4000);
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
            setMessage({ type: "error", text: "Cancellation request failed. Please try again." });
        } finally {
            setIsCancelling(false);
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

    // Subscription Plans data
    const plans = [
        {
            id: "starter",
            name: "Starter Basic",
            icon: Cpu,
            color: "emerald",
            price: { INR: "₹799", USD: "$9.99" },
            desc: "Best for hobbyists or small laboratories tracking individual edge microcontrollers.",
            features: [
                "Up to 3 active IoT devices",
                "7-day telemetry history",
                "Basic danger/warning alerts",
                "Email alert integrations",
                "Shared SQLite local DB setup"
            ]
        },
        {
            id: "professional",
            name: "Pro Control Center",
            icon: Zap,
            color: "violet",
            price: { INR: "₹1,999", USD: "$24.99" },
            desc: "Perfect for factories, warehouses, and organizations requiring bento control centers.",
            features: [
                "Up to 15 active IoT devices",
                "60-day telemetry retention",
                "Custom dashboard icon picking",
                "SMS & Email hazard alarms",
                "Schneider EM simulator support",
                "Sub-second REST API ingestion",
                "Priority email support"
            ]
        },
        {
            id: "enterprise",
            name: "Industrial Grid",
            icon: Layers,
            color: "fuchsia",
            price: { INR: "₹7,999", USD: "$99.99" },
            desc: "Full industrial compliance, high scale, predictive analytics, and SLA guarantees.",
            features: [
                "Unlimited registered devices",
                "365-day cold storage history",
                "Custom ML anomaly forecasts",
                "Sub-second WebSocket feeds",
                "Multiple users / organization role access",
                "Dedicated database cloud nodes",
                "24/7 Phone & Slack SLA support"
            ]
        }
    ];

    const currentPlanDetails = plans.find(p => p.id === (user?.subscription_plan || "starter"));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto pb-20 space-y-8"
        >
            {/* SaaS Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-[#0a0f1d] border border-white/5 shadow-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-emerald-500/10 pointer-events-none" />
                <div className="relative z-10">
                    <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
                        SaaS Subscription Plan Active
                    </span>
                    <h1 className="text-3xl font-extrabold text-white mt-3 tracking-tight">
                        {profile.full_name || "IoT Administrator"}
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium flex items-center gap-2">
                        <span>Current Tier:</span>
                        <strong className="text-white uppercase tracking-wider">{currentPlanDetails?.name}</strong>
                        <span>•</span>
                        <span className="text-emerald-400 uppercase font-bold text-xs">{user?.subscription_status || "ACTIVE"}</span>
                    </p>
                </div>

                <div className="relative z-10 bg-white/5 border border-white/10 px-5 py-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400">
                        <Globe size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default Billing Currency</p>
                        <div className="flex gap-2 mt-1">
                            <button 
                                onClick={() => setCurrency("INR")}
                                className={clsx(
                                    "px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all",
                                    currency === "INR" ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300"
                                )}
                            >
                                INR (₹)
                            </button>
                            <button 
                                onClick={() => setCurrency("USD")}
                                className={clsx(
                                    "px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all",
                                    currency === "USD" ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300"
                                )}
                            >
                                USD ($)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Tabs Navigation */}
            <div className="flex border-b border-white/5 gap-1 select-none">
                {[
                    { id: "profile", name: "Profile Settings", icon: User },
                    { id: "billing", name: "Billing & Subscriptions", icon: CreditCard },
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
                                        {currentPlanDetails?.name} Plan
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

                {activeTab === "billing" && (
                    <motion.div
                        key="billing"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Currency toggle and plan subtitle */}
                        <div className="flex justify-between items-center flex-wrap gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CreditCard className="text-violet-400" /> Choose the perfect SaaS Plan
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Scale subscription bounds to accommodate high-frequency industrial sensors and analytics.</p>
                            </div>
                        </div>

                        {/* Active Subscription Summary Box */}
                        {user?.subscription_plan && user.subscription_plan !== "free" && user.subscription_plan !== "none" && (
                            <div className="neo-card p-6 border-violet-500/20 bg-gradient-to-r from-violet-950/15 via-[#0b132b]/80 to-[#020617] relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[200%] bg-gradient-to-l from-violet-500/5 to-transparent pointer-events-none" />
                                <div className="space-y-2 relative z-10">
                                    <span className="px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase rounded-full tracking-widest">
                                        Subscribed Member
                                    </span>
                                    <h3 className="text-lg font-extrabold text-white uppercase tracking-tight mt-1">
                                        Current Plan: {user.subscription_plan}
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Your subscription status is <span className="text-emerald-400 font-bold uppercase">{user.subscription_status}</span> using <span className="text-white font-bold">{user.subscription_currency}</span> currency.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsCancelModalOpen(true)}
                                    className="px-6 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 relative z-10 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                                >
                                    Cancel Subscription
                                </button>
                            </div>
                        )}

                        {/* Pricing Cards Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {plans.map(plan => {
                                const PlanIcon = plan.icon;
                                const isActive = user?.subscription_plan === plan.id;
                                const isCurrentCurrency = user?.subscription_currency === currency;
                                
                                return (
                                    <div 
                                        key={plan.id}
                                        className={clsx(
                                            "neo-card p-6 flex flex-col justify-between transition-all duration-300 relative",
                                            isActive 
                                                ? "border-emerald-500 bg-gradient-to-b from-[#10b981]/5 to-[#0b1424] shadow-[0_0_30px_rgba(16,185,129,0.08)] scale-[1.02]" 
                                                : "border-white/5 hover:border-white/10 hover:shadow-xl"
                                        )}
                                    >
                                        {isActive && (
                                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase rounded-full tracking-widest shadow-md">
                                                Active subscription
                                            </span>
                                        )}

                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div className={clsx(
                                                    "p-3 rounded-2xl border",
                                                    plan.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                                    plan.color === 'violet' ? "bg-violet-500/10 border-violet-500/20 text-violet-400" :
                                                    "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
                                                )}>
                                                    <PlanIcon size={22} />
                                                </div>
                                                
                                                <div className="text-right">
                                                    <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price[currency]}</span>
                                                    <span className="text-[10px] text-slate-500 block font-bold mt-[-2px]">/ MONTH</span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-bold text-white mt-4">{plan.name}</h3>
                                            <p className="text-xs text-slate-400 mt-2 leading-relaxed h-12 overflow-hidden">{plan.desc}</p>

                                            <div className="h-px bg-white/5 my-4"></div>

                                            <ul className="space-y-2">
                                                {plan.features.map((feat, index) => (
                                                    <li key={index} className="flex items-start gap-2.5 text-xs text-slate-300">
                                                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="mt-6">
                                            {isActive ? (
                                                <button 
                                                    disabled
                                                    className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1.5"
                                                >
                                                    <CheckCircle size={14} /> Current Plan
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => submitUpgrade(plan.id)}
                                                    disabled={isUpgrading}
                                                    className={clsx(
                                                        "w-full py-3 font-bold rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5",
                                                        plan.color === 'emerald' ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" :
                                                        plan.color === 'violet' ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/25" :
                                                        "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-md shadow-fuchsia-600/25",
                                                        isUpgrading && "opacity-75 cursor-not-allowed"
                                                    )}
                                                >
                                                    {isUpgrading && selectedPlan === plan.id ? (
                                                        <>
                                                            <Loader className="animate-spin" size={14} /> Redirecting...
                                                        </>
                                                    ) : (
                                                        "Upgrade Plan"
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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

            {/* Simulated Subscription Payment Checkout Modal */}
            {/* Checkout modal completely removed - redirects directly to PayU gateway */}

            {/* Cancel Subscription Confirmation Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
                        {/* Blur Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCancelModalOpen(false)}
                            className="absolute inset-0 bg-[#020617]/70 backdrop-blur-md"
                        />

                        {/* Modal Dialog */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#0b132b]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
                        >
                            {/* Decorative background light */}
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-red-600/5 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 mx-auto bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4">
                                    <AlertTriangle size={32} className="text-red-400" />
                                </div>
                                
                                <h3 className="text-lg font-bold text-white mb-2">Cancel Subscription?</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                    Are you sure you want to cancel your <strong className="text-white uppercase">{user?.subscription_plan}</strong> plan? Your telemetry metrics ingestion and custom analytics triggers will be instantly downgraded back to default Free limits.
                                </p>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                                    >
                                        Keep My Plan
                                    </button>
                                    <button 
                                        onClick={submitCancellation}
                                        disabled={isCancelling}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/25 disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isCancelling ? (
                                            <>
                                                <Loader className="animate-spin" size={14} /> Processing...
                                            </>
                                        ) : (
                                            "Yes, Cancel"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
