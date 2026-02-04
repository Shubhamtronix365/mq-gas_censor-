import { Lightbulb } from "lucide-react";
import React from "react";

const AutoBulb = ({ isOn, brightness }) => {
    // Map brightness (0-1050) to opacity (0.1 - 1)
    const opacity = isOn ? Math.max(0.1, Math.min(1, brightness / 1050)) : 0.1;
    const glowKey = isOn ? `0 0 ${brightness / 20}px ${brightness / 40}px rgba(255, 223, 0, ${opacity})` : "none";

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-bold text-primary mb-6">Auto Bulb Status</h3>

            <div className="relative">
                <div
                    className="transition-all duration-500 ease-in-out rounded-full p-8"
                    style={{
                        backgroundColor: isOn ? `rgba(255, 240, 100, ${opacity * 0.5})` : '#f1f5f9',
                        boxShadow: glowKey
                    }}
                >
                    <Lightbulb
                        size={64}
                        className={`transition-all duration-500 ${isOn ? 'text-yellow-500' : 'text-slate-400'}`}
                        fill={isOn ? "currentColor" : "none"}
                    />
                </div>
            </div>

            <div className="mt-8 text-center">
                <div className={`text-2xl font-bold mb-1 ${isOn ? 'text-yellow-600' : 'text-slate-400'}`}>
                    {isOn ? "ON" : "OFF"}
                </div>
                <div className="text-sm text-secondary font-mono">
                    Brightness: {isOn ? brightness : 0} / 1050
                </div>
            </div>
        </div>
    );
};

export default AutoBulb;
