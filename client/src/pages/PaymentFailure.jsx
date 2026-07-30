import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, RotateCcw, ArrowRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const PaymentFailure = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const txnid = searchParams.get("txnid") || "TXN_FAILED";
    const plan = searchParams.get("plan") || "starter";
    const amount = searchParams.get("amount") || "0.00";
    const currency = searchParams.get("currency") || "INR";
    const reason = searchParams.get("reason") || "Transaction declined by gateway or issuer";

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 relative overflow-hidden select-none">
            {/* Background glowing rings */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-lg bg-[#0b132b]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl text-center overflow-hidden"
            >
                {/* Decorative border gradient */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-rose-400 to-amber-500" />

                <div className="relative z-10">
                    {/* Icon container */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 mx-auto bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
                    >
                        <XCircle size={40} className="text-red-400" />
                    </motion.div>

                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">Payment Failed</h1>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                        We could not process your transaction. Your payment details might be incorrect, or the bank has declined the transaction.
                    </p>

                    {/* Metadata Card */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 my-6 space-y-3.5 text-left">
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Transaction ID</span>
                            <span className="text-white font-mono font-bold select-all">{txnid}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Attempted Plan</span>
                            <span className="px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold rounded-full uppercase">
                                {plan}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Transaction Status</span>
                            <span className="text-red-400 font-bold uppercase">DECLINED</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Failure Reason</span>
                            <span className="text-slate-300 font-medium truncate max-w-[200px]" title={reason}>{reason}</span>
                        </div>
                    </div>

                    {/* Warning Notice */}
                    <div className="flex gap-2.5 items-start p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300 leading-relaxed mb-6">
                        <AlertTriangle className="shrink-0 text-amber-400" size={16} />
                        <span>No money was charged to your account. If amount was debited, it will be automatically refunded by PayU in 3-5 business days.</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 select-none">
                        <button
                            onClick={() => navigate("/subscription")}
                            className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-50 hover:to-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/25"
                        >
                            <RotateCcw size={14} /> Retry Payment
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailure;
