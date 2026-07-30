import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, reloadUser } = useAuth();

    const txnid = searchParams.get("txnid") || "TXN_PENDING";
    const plan = searchParams.get("plan") || "starter";
    const amount = searchParams.get("amount") || "0.00";
    const currency = searchParams.get("currency") || "INR";

    // Reload the user context to ensure the updated subscription status is fetched
    useEffect(() => {
        if (reloadUser) {
            reloadUser();
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden select-none">
            {/* Background glowing rings */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-lg bg-[#0b132b]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center overflow-hidden"
            >
                {/* Decorative border gradient */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-violet-500" />

                <div className="relative z-10">
                    {/* Icon container */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 mx-auto bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    >
                        <CheckCircle size={40} className="text-emerald-400" />
                    </motion.div>

                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Payment Successful!</h1>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        Thank you for upgrading. Your SenseGrid subscription details have been successfully updated in our telemetry network cluster.
                    </p>

                    {/* Metadata Card */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 my-6 space-y-3.5 text-left">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Transaction ID</span>
                            <span className="text-white font-mono font-bold select-all">{txnid}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Upgraded Plan</span>
                            <span className="px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold rounded-full uppercase">
                                {plan}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Amount Paid</span>
                            <span className="text-white font-extrabold text-sm">{currency === 'USD' ? '$' : '₹'}{amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Account Node</span>
                            <span className="text-slate-300 font-medium truncate max-w-[200px]">{user?.email}</span>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="flex gap-2.5 items-start p-4 rounded-xl bg-violet-600/10 border border-violet-500/20 text-left text-xs text-violet-300 leading-relaxed mb-6">
                        <ShieldCheck className="shrink-0 text-violet-400" size={16} />
                        <span>A transaction confirmation and receipt has been sent to your email address (and CC'd to supervisors) via Brevo.</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 select-none">
                        <button
                            onClick={() => navigate("/")}
                            className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                            Go to Console <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
