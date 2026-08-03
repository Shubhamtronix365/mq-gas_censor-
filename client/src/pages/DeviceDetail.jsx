import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import GasDashboard from "./GasDashboard";
import LDRDashboard from "./LDRDashboard";
import UnifiedDashboard from "./UnifiedDashboard";
import AirQualityDashboard from "./AirQualityDashboard";
import EnergyMeterDashboard from "./EnergyMeterDashboard";

const DeviceDetail = () => {
    const { id } = useParams();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeviceInfo = async () => {
            try {
                const cleanId = encodeURIComponent(id.trim());
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${cleanId}`);
                setDevice(response.data);
            } catch (error) {
                console.error("Error fetching device info directly, trying list fallback:", error);
                try {
                    const listRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/`);
                    const rawId = decodeURIComponent(id).trim().toLowerCase();
                    const matched = listRes.data.find(d => 
                        d.device_id.trim().toLowerCase() === rawId ||
                        d.device_id.trim() === id.trim()
                    );
                    if (matched) {
                        setDevice(matched);
                    }
                } catch (err) {
                    console.error("Fallback device list fetch failed:", err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDeviceInfo();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400 font-medium">Loading device configuration...</div>;
    }

    if (!device) {
        return (
            <div className="p-8 text-center max-w-md mx-auto my-12 neo-card border border-rose-500/20">
                <h3 className="text-xl font-bold text-white mb-2">Device Not Found</h3>
                <p className="text-xs text-slate-400 mb-4">No active node registered with ID <code className="text-amber-400">{id}</code>.</p>
            </div>
        );
    }

    if (device.device_type === 'ldr_sensor') {
        return <LDRDashboard id={id} device={device} />;
    }

    if (device.device_type === 'combined_sensor') {
        return <UnifiedDashboard id={id} device={device} />;
    }

    if (device.device_type === 'air_quality_monitor') {
        return <AirQualityDashboard id={id} device={device} />;
    }

    if (device.device_type === 'energy_meter') {
        return <EnergyMeterDashboard id={id} device={device} />;
    }

    // Default to Gas Sensor
    return <GasDashboard id={id} device={device} />;
};

export default DeviceDetail;
