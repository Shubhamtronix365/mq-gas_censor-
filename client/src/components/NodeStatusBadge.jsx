import { useState, useEffect } from "react";

/**
 * NodeStatusBadge component for dynamic Blynk-style Online / Offline IoT Node status rendering.
 */

const formatRelativeTime = (lastSeen) => {
    if (!lastSeen) return "Never connected";
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) return "Offline";

    const diffSeconds = Math.floor((new Date() - date) / 1000);
    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const NodeStatusBadge = ({ device, isOnline: isOnlineProp, lastSeen: lastSeenProp, timeoutSeconds = 30, className = "" }) => {
    const [, setTick] = useState(0);

    // Dynamic timer tick to refresh relative time strings
    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const lastSeen = device?.last_seen || lastSeenProp;
    
    // Determine isOnline dynamically
    let isOnline = false;
    if (typeof isOnlineProp === "boolean") {
        isOnline = isOnlineProp;
    } else if (device && typeof device.is_online === "boolean") {
        isOnline = device.is_online;
    }

    // Fallback timestamp check if is_online isn't provided directly
    if (!isOnline && lastSeen) {
        const date = new Date(lastSeen);
        if (!isNaN(date.getTime())) {
            const diffSeconds = Math.floor((new Date() - date) / 1000);
            if (diffSeconds >= 0 && diffSeconds <= timeoutSeconds) {
                isOnline = true;
            }
        }
    }

    const relativeTimeString = formatRelativeTime(lastSeen);

    if (isOnline) {
        return (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0 ${className}`} title="Active telemetry stream">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Online</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-500/10 border border-slate-500/20 shrink-0 ${className}`} title={`Last seen: ${relativeTimeString}`}>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Offline {lastSeen ? `(${relativeTimeString})` : ""}
            </span>
        </div>
    );
};

export default NodeStatusBadge;
