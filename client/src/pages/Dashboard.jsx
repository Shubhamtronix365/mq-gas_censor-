import { useState, useEffect } from "react";
import axios from "axios";
import { Server, Activity, CheckCircle2, ArrowRight, Zap, Database, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OnboardingModal from "../components/OnboardingModal";
import { motion } from "framer-motion";

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ total: 0, active: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
            const devices = response.data || [];
            setStats({
                total: devices.length,
                active: devices.length
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
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

    return (
        <div className="relative pb-20">
            {/* Onboarding Modal */}
            {user && !user.full_name && <OnboardingModal />}

            {/* Decorative Background Elements for Dashboard */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {/* Welcome Header */}
                <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                            Mission Control
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Welcome back, <span className="text-violet-400 font-bold">{user?.full_name || 'Commander'}</span>. System status is nominal.
                        </p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live Connection
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card 1 */}
                    <div className="neo-card p-6 relative group hover:border-violet-500/30">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Database size={64} />
                        </div>
                        <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl w-fit mb-4">
                            <Server size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Devices</p>
                            <h3 className="text-4xl font-bold text-white">{loading ? "-" : stats.total}</h3>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="neo-card p-6 relative group hover:border-emerald-500/30">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={64} />
                        </div>
                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl w-fit mb-4">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Active Nodes</p>
                            <h3 className="text-4xl font-bold text-white">{loading ? "-" : stats.active}</h3>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="neo-card p-6 relative group hover:border-blue-500/30">
                        <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Shield size={64} />
                        </div>
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl w-fit mb-4">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">System Health</p>
                            <h3 className="text-4xl font-bold text-white">100%</h3>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div variants={item}>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap size={20} className="text-yellow-400" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/devices" className="group">
                            <div className="neo-card p-6 h-full flex flex-col justify-between hover:bg-white/5 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-violet-600/10 rounded-xl text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                        <Server size={24} />
                                    </div>
                                    <ArrowRight className="text-slate-600 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg mb-1 group-hover:text-violet-300 transition-colors">Manage Devices</h4>
                                    <p className="text-sm text-slate-400">Add, configured and monitor your IoT hardware nodes.</p>
                                </div>
                            </div>
                        </Link>

                        {/* Placeholder Action */}
                        <div className="neo-card p-6 h-full flex flex-col justify-between opacity-50 cursor-not-allowed border-dashed border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-800 rounded-xl text-slate-500">
                                    <Activity size={24} />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-500 text-lg mb-1">Analytics Report</h4>
                                <p className="text-sm text-slate-600">Coming soon in the next update.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
