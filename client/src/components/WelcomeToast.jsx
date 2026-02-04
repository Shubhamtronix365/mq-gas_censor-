import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const WelcomeToast = ({ name }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500">
            <div className="bg-white/90 backdrop-blur-md shadow-xl border border-primary/20 rounded-full px-8 py-4 flex items-center space-x-3">
                <Sparkles className="text-yellow-500 animate-pulse" size={24} />
                <span className="text-lg font-medium text-primary">
                    Hello, Welcome <span className="font-bold">{name}</span>!
                </span>
            </div>
        </div>
    );
};

export default WelcomeToast;
