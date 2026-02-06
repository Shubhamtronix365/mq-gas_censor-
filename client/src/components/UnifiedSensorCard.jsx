import { motion } from "framer-motion";
import { clsx } from "clsx";

const SensorCard = ({ title, value, unit, icon: Icon, color }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className={clsx(
            "neo-card p-5 relative overflow-hidden group border",
            color === 'violet' ? 'border-violet-500/20 hover:border-violet-500/40' :
                color === 'amber' ? 'border-yellow-500/20 hover:border-yellow-500/40' :
                    color === 'cyan' ? 'border-cyan-500/20 hover:border-cyan-500/40' :
                        'border-rose-500/20 hover:border-rose-500/40'
        )}
    >
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity duration-500`}>
            <Icon size={64} className={clsx(
                color === 'violet' ? 'text-violet-500' :
                    color === 'amber' ? 'text-yellow-500' :
                        color === 'cyan' ? 'text-cyan-500' : 'text-rose-500'
            )} />
        </div>

        <div className={clsx("p-3 rounded-2xl w-fit mb-4 border transition-colors duration-300",
            color === 'violet' ? 'bg-violet-500/10 border-violet-500/20 text-violet-400 group-hover:bg-violet-500/20' :
                color === 'amber' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/20' :
                    color === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20'
        )}>
            <Icon size={24} />
        </div>

        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</h3>
        <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tracking-tight">
                {value ?? "--"}
            </span>
            <span className="text-sm text-slate-500 font-medium">{unit}</span>
        </div>
    </motion.div>
);

export default SensorCard;
