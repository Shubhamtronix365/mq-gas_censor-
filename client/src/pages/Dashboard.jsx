import { startTransition, useState, useEffect } from "react";
import axios from "axios";
import { Plus, Server, Activity, AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OnboardingModal from "../components/OnboardingModal";
import WelcomeToast from "../components/WelcomeToast";

const Dashboard = () => {
    const { user } = useAuth();
    const [showWelcome, setShowWelcome] = useState(false);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDeviceId, setNewDeviceId] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchDevices();

        // Show welcome message only once per session
        const welcomeShown = sessionStorage.getItem("welcomeShown");
        if (user && user.full_name && !welcomeShown) {
            setShowWelcome(true);
            sessionStorage.setItem("welcomeShown", "true");
        }
    }, [user]);

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
                device_id: newDeviceId
            });
            setShowAddModal(false);
            setNewDeviceId("");
            fetchDevices();
        } catch (error) {
            alert("Failed to add device. ID might be taken.");
        }
    };

    const handleDeleteDevice = async (e, deviceId) => {
        e.preventDefault(); // Prevent link navigation
        e.stopPropagation(); // Stop event bubbling

        if (!window.confirm(`Are you sure you want to delete device ${deviceId}? This cannot be undone.`)) {
            return;
        }

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/devices/${deviceId}`);
            fetchDevices(); // Refresh list
        } catch (error) {
            console.error("Error deleting device:", error);
            alert("Failed to delete device.");
        }
    };

    return (
        <div className="relative">
            {/* Onboarding Modal - Forces name completion */}
            {user && !user.full_name && <OnboardingModal />}

            {/* Welcome Animation */}
            {showWelcome && user && user.full_name && <WelcomeToast name={user.full_name} />}

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
                    <p className="text-secondary">Overview of your connected devices</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus size={18} />
                    <span>Add Device</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-secondary">Loading devices...</div>
            ) : devices.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-border">
                    <Server className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-primary">No devices found</h3>
                    <p className="text-secondary mb-6">Add your first ESP32 device to get started</p>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        Add Device
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {devices.map((device) => (
                        <Link to={`/devices/${device.device_id}`} key={device.device_id} className="card-premium p-6 group block">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                    <Server size={24} />
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-secondary">
                                        {device.device_id}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteDevice(e, device.device_id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="Delete Device"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-primary mb-1">ESP32 Sensor Node</h3>
                            <p className="text-sm text-secondary mb-4">Click to view real-time data</p>

                            <div className="flex items-center space-x-2 text-sm text-secondary">
                                <Activity size={16} />
                                <span>Active Monitoring</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Add Device Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Add New Device</h2>
                        <form onSubmit={handleAddDevice}>
                            <label className="block text-sm font-medium text-secondary mb-2">Device ID</label>
                            <input
                                type="text"
                                required
                                className="input-field mb-6"
                                placeholder="e.g. ESP32_01"
                                value={newDeviceId}
                                onChange={(e) => setNewDeviceId(e.target.value)}
                            />
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-2 rounded-lg border border-border hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 btn-primary py-2">
                                    Add Device
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
