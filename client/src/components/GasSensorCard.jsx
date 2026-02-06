import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Edit3 } from "lucide-react";

const SensorCard = ({ title, value, unit, Icon, colorClass, onClick, accentColor }) => {
    // Dynamic border color based on accent
    const borderColor = accentColor === 'emerald' ? 'group-hover:border-emerald-500/50' :
        accentColor === 'orange' ? 'group-hover:border-orange-500/50' :
            accentColor === 'blue' ? 'group-hover:border-blue-500/50' : 'group-hover:border-violet-500/50';

    return (
        <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            onClick={onClick}
            className={clsx("neo-card p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group relative border border-white/5", borderColor)}
        >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Edit3 size={14} />
                </div>
            </div>

            <div className={clsx("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 duration-300 shadow-lg", colorClass)}>
                <Icon size={32} />
            </div>

            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
            <div className="text-3xl font-bold text-white flex items-baseline gap-1">
                {value ?? "--"} <span className="text-lg text-slate-500 font-medium">{unit}</span>
            </div>
        </motion.div>
    );
};

export default SensorCard;
