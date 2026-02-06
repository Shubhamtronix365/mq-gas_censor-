import { Lightbulb } from "lucide-react";
import React from "react";

const AutoBulb = ({ isOn, brightness }) => {
    // Map brightness (0-4095) to opacity (0.2 - 1)
    // Assuming max analog value is 4095 for ESP32 (12-bit), though code comments said 1050 previously.
    // LDR usually: Low resistance in light -> High val? Or invalid?
    // Let's assume passed brightness is the raw value.
    const opacity = isOn ? Math.max(0.2, Math.min(1, brightness / 4095)) : 0.1;
    const glowKey = isOn ? `0 0 ${brightness / 50}px ${brightness / 100}px rgba(234, 179, 8, ${opacity})` : "none";

    return (
        <div className="neo-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500">
            {/* Ambient Background Glow */}
            <div
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: isOn
                        ? `radial-gradient(circle at center, rgba(234, 179, 8, ${opacity * 0.3}) 0%, transparent 70%)`
                        : 'none'
                }}
            />

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">Smart Bulb Status</h3>

            <div className="relative z-10">
                <div
                    className="transition-all duration-500 ease-in-out rounded-full p-8 border border-white/5"
                    style={{
                        backgroundColor: isOn ? `rgba(234, 179, 8, ${opacity * 0.2})` : 'rgba(255, 255, 255, 0.05)',
                        boxShadow: glowKey
                    }}
                >
                    <Lightbulb
                        size={48}
                        className={`transition-all duration-500 ${isOn ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]' : 'text-slate-600'}`}
                        fill={isOn ? "currentColor" : "none"}
                    />
                </div>
            </div>

            <div className="mt-6 text-center relative z-10">
                <div className={`text-2xl font-bold mb-1 ${isOn ? 'text-yellow-400' : 'text-slate-500'}`}>
                    {isOn ? "ACTIVE" : "IDLE"}
                </div>
                <div className="text-[10px] text-slate-400 font-mono bg-white/5 px-2 py-1 rounded-full inline-block">
                    INTENSITY: {brightness}
                </div>
            </div>
        </div>
    );
};

export default AutoBulb;
