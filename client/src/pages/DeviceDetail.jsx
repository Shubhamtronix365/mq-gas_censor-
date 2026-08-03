import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import GasDashboard from "./GasDashboard";
import LDRDashboard from "./LDRDashboard";
import UnifiedDashboard from "./UnifiedDashboard";
import AirQualityDashboard from "./AirQualityDashboard";
import EnergyMeterDashboard from "./EnergyMeterDashboard";
import { Cpu, Plus, AlertCircle } from "lucide-react";

const DeviceDetail = () => {
    const { id } = useParams();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeviceInfo = async () => {
            const rawId = (id || "").trim().toLowerCase();
            const cleanId = encodeURIComponent((id || "").trim());

            try {
                // Step 1: Direct endpoint fetch
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${cleanId}`);
                setDevice(response.data);
            } catch (error) {
                console.warn(`Direct fetch for device '${id}' failed. Running fallback user device matching...`);
                try {
                    // Step 2: Fallback list resolution across user's registered nodes
                    const listRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
                    const userDevices = listRes.data || [];

                    // Match 1: Exact case-insensitive ID match
                    let matched = userDevices.find(d => d.device_id.trim().toLowerCase() === rawId);

                    // Match 2: Contains query substring
                    if (!matched) {
                        matched = userDevices.find(d => d.device_id.trim().toLowerCase().includes(rawId));
                    }

                    // Match 3: Type fallback (e.g. if URL is 'fusion', match first combined_sensor node)
                    if (!matched) {
                        if (rawId.includes("fusion") || rawId.includes("combined") || rawId.includes("unified")) {
                            matched = userDevices.find(d => d.device_type === "combined_sensor");
                        } else if (rawId.includes("air") || rawId.includes("aqi")) {
                            matched = userDevices.find(d => d.device_type === "air_quality_monitor");
                        } else if (rawId.includes("ldr") || rawId.includes("light")) {
                            matched = userDevices.find(d => d.device_type === "ldr_sensor");
                        } else if (rawId.includes("gas")) {
                            matched = userDevices.find(d => d.device_type === "gas_sensor");
                        }
                    }

                    if (matched) {
                        setDevice(matched);
                    }
                } catch (err) {
                    console.error("Fallback device resolution failed:", err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDeviceInfo();
    }, [id]);

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                <span>Resolving node configuration...</span>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="p-8 max-w-lg mx-auto my-12 neo-card border border-rose-500/20 text-center flex flex-col items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                    <AlertCircle size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-extrabold text-white">Node Not Found</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        No active device registered matching ID <code className="text-amber-400 font-mono font-bold">{id}</code> in your account.
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <Link
                        to="/devices"
                        className="px-4 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Deploy New Device Node
                    </Link>
                </div>
            </div>
        );
    }

    if (device.device_type === 'ldr_sensor') {
        return <LDRDashboard id={device.device_id} device={device} />;
    }

    if (device.device_type === 'combined_sensor') {
        return <UnifiedDashboard id={device.device_id} device={device} />;
    }

    if (device.device_type === 'air_quality_monitor') {
        return <AirQualityDashboard id={device.device_id} device={device} />;
    }

    if (device.device_type === 'energy_meter') {
        return <EnergyMeterDashboard id={device.device_id} device={device} />;
    }

    // Default to Gas Sensor
    return <GasDashboard id={device.device_id} device={device} />;
};

export default DeviceDetail;
