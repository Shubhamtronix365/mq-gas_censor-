import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import GasDashboard from "./GasDashboard";
import LDRDashboard from "./LDRDashboard";

const DeviceDetail = () => {
    const { id } = useParams();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeviceInfo = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/devices/${id}`);
                setDevice(response.data);
            } catch (error) {
                console.error("Error fetching device info:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeviceInfo();
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center text-secondary">Loading device configuration...</div>;
    }

    if (!device) {
        return <div className="p-8 text-center text-red-500">Device not found</div>;
    }

    if (device.device_type === 'ldr_sensor') {
        return <LDRDashboard id={id} device={device} />;
    }

    // Default to Gas Sensor if type is missing or matches
    return <GasDashboard id={id} device={device} />;
};

export default DeviceDetail;
