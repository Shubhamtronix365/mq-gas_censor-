import { motion } from "framer-motion";
import { clsx } from "clsx";

const LayoutWrapper = ({ children, className }) => {
    return (
        <div className="relative min-h-screen bg-[#020617] text-white overflow-hidden font-sans selection:bg-violet-500/30">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 100, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -100, 0],
                        y: [0, 100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"
                />
            </div>

            {/* Glass Grain Overlay (Optional Texture) */}
            <div className="fixed inset-0 z-[1] opacity-20 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Content Container */}
            <div className={clsx("relative z-10", className)}>
                {children}
            </div>
        </div>
    );
};

export default LayoutWrapper;
