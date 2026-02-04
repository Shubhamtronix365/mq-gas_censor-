import { startTransition, useState, useEffect } from "react";
import axios from "axios";
import { Plus, Server, Activity, AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OnboardingModal from "../components/OnboardingModal";

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
            // Simple mock stats derived from devices list for now
            const devices = response.data || [];
            setStats({
                total: devices.length,
                active: devices.length // Assuming all returned are "active" for now or add logic if needed
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* Onboarding Modal - Forces name completion */}
            {user && !user.full_name && <OnboardingModal />}

            <div className="mb-8 animate-in slide-in-from-left duration-700 fade-in">
                <h1 className="text-3xl font-bold text-primary mb-2">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{user?.full_name || 'User'}</span>!
                </h1>
                <p className="text-secondary text-lg">Here's what's happening with your sensor network today.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-secondary">Loading statistics...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-in slide-in-from-bottom duration-700 delay-150 fade-in fill-mode-backwards">
                    {/* Stat Card 1 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Server size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary font-medium">Total Devices</p>
                            <h3 className="text-2xl font-bold text-primary">{stats.total}</h3>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary font-medium">Active Monitoring</p>
                            <h3 className="text-2xl font-bold text-primary">{stats.active}</h3>
                        </div>
                    </div>

                    {/* Stat Card 3 (Placeholder) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-border flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-secondary font-medium">System Status</p>
                            <h3 className="text-2xl font-bold text-primary">Optimal</h3>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-border p-6 animate-in slide-in-from-bottom duration-700 delay-300 fade-in fill-mode-backwards">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-primary">Quick Actions</h3>
                </div>
                <div className="flex gap-4">
                    <Link to="/devices" className="btn-primary inline-flex items-center space-x-2">
                        <Server size={18} />
                        <span>Manage Devices</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
