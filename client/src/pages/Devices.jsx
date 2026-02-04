import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Server, Activity, AlertTriangle, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const Devices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newDeviceId, setNewDeviceId] = useState("");
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
                device_id: newDeviceId
            });
            setShowAddModal(false);
            setNewDeviceId("");
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

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Devices</h1>
                    <p className="text-secondary">Manage your connected ESP32 nodes</p>
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
                                        onClick={(e) => handleDeleteClick(e, device.device_id)}
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

            {/* Delete Confirmation Modal */}
            {deviceToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Device?</h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Are you sure you want to permanently delete device <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1 rounded">{deviceToDelete}</span>?
                                <br />This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setDeviceToDelete(null)}
                                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 px-4 bg-red-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg shadow-red-600/20 transition-all duration-200"
                            >
                                Delete Device
                            </button>
                        </div>
                    </div>
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

export default Devices;
