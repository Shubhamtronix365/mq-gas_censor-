import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { 
    CreditCard, Globe, Check, CheckCircle, AlertTriangle, Loader, 
    Layers, Cpu, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import LayoutWrapper from "../layouts/LayoutWrapper";

const plans = [
    {
        id: "starter",
        name: "Starter Basic",
        price: { INR: "₹799", USD: "$9.99" },
        desc: "Essential parameters tracking for small telemetry deployments and makers.",
        icon: Cpu,
        color: "emerald",
        features: [
            "Up to 5 active IoT nodes",
            "Real-time sensor graphs",
            "1-day historical data retention",
            "Basic alerts notification"
        ]
    },
    {
        id: "professional",
        name: "Pro Control Center",
        price: { INR: "₹1,999", USD: "$24.99" },
        desc: "Advanced analytic telemetry tools and quotas for small industrial plants.",
        icon: Zap,
        color: "violet",
        features: [
            "Up to 15 active IoT nodes",
            "Real-time + interactive analytical charts",
            "30-day historical data retention",
            "Custom automation rule triggers",
            "Email & SMS notification updates",
            "Prioritized developer support"
        ]
    },
    {
        id: "enterprise",
        name: "Industrial Grid",
        price: { INR: "₹7,999", USD: "$99.99" },
        desc: "Enterprise scale B2B cluster tracking with unlimited parameters retention.",
        icon: Layers,
        color: "fuchsia",
        features: [
            "Unlimited active IoT devices",
            "Dedicated SaaS cloud node metrics",
            "Unlimited historical data logs",
            "High frequency 100ms polling",
            "Premium custom analytical reports",
            "24/7 dedicated support phone line",
            "Custom firmware SLA updates"
        ]
    }
];

const Subscription = () => {
    const { user, loading: authLoading, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currency, setCurrency] = useState(user?.subscription_currency || "INR"); // INR, USD
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [message, setMessage] = useState(null);

    // Parse payment callbacks on redirect landing
    useEffect(() => {
        const paymentStatus = searchParams.get("payment");
        const txnid = searchParams.get("txnid");
        const plan = searchParams.get("plan");
        const reason = searchParams.get("reason");
        
        if (paymentStatus === "success") {
            setMessage({ type: "success", text: `Payment successful! Upgraded to the ${plan?.toUpperCase()} Plan (TXN: ${txnid}).` });
            setSearchParams({});
        } else if (paymentStatus === "failure") {
            setMessage({ type: "error", text: `Payment failed for transaction ${txnid}. Please try again.` });
            setSearchParams({});
        } else if (paymentStatus === "error") {
            setMessage({ type: "error", text: `Payment validation error: ${reason || "unknown error"}` });
            setSearchParams({});
        }
    }, [searchParams]);

    const submitUpgrade = async (planId) => {
        setIsUpgrading(true);
        setSelectedPlan(planId);
        setMessage(null);

        try {
            // Initiate PayU Payment Gateway session
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/payment/initiate`, {
                plan_id: planId,
                currency: currency
            });

            const paymentData = response.data;

            // Dynamically construct and submit the PayU standard redirect form POST
            const form = document.createElement("form");
            form.method = "POST";
            form.action = paymentData.payu_url;

            for (const key in paymentData) {
                if (key !== "payu_url") {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = key;
                    input.value = paymentData[key];
                    form.appendChild(input);
                }
            }

            document.body.appendChild(form);
            form.submit();
        } catch (error) {
            console.error("Failed to initiate PayU payment", error);
            setMessage({ type: "error", text: "Failed to connect to PayU Gateway. Please try again." });
            setIsUpgrading(false);
        }
    };

    const submitCancellation = async () => {
        setIsCancelling(true);
        setMessage(null);

        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me/subscription`, {
                subscription_plan: "free",
                subscription_status: "inactive",
                subscription_currency: "INR",
                subscription_expiry: null
            });

            updateUser(response.data);
            setIsCancelModalOpen(false);
            setMessage({ type: "success", text: "Subscription cancelled successfully. Account downgraded to Free plan." });
            setTimeout(() => setMessage(null), 4000);
        } catch (error) {
            console.error("Failed to cancel subscription:", error);
            setMessage({ type: "error", text: "Cancellation request failed. Please try again." });
        } finally {
            setIsCancelling(false);
        }
    };

    if (authLoading) return (
        <div className="flex justify-center items-center h-[60vh]">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin"></div>
            </div>
        </div>
    );

    const hasActiveSubscription = user?.subscription_plan && user.subscription_plan !== "free" && user.subscription_plan !== "none";

    return (
        <LayoutWrapper className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-white/5 neo-card">
                {/* Background decorative gradient */}
                <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-gradient-to-bl from-violet-600/10 via-transparent to-transparent pointer-events-none" />

                <div className="flex justify-between items-center flex-wrap gap-4 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <CreditCard className="text-violet-400" size={32} /> Plans & Subscriptions
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Manage billing currency, review package limits, and modify active cloud telemetry tiers.</p>
                    </div>

                    {/* Currency Toggle */}
                    <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 select-none">
                        <button
                            onClick={() => setCurrency("INR")}
                            className={clsx(
                                "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                currency === "INR" 
                                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            INR (₹)
                        </button>
                        <button
                            onClick={() => setCurrency("USD")}
                            className={clsx(
                                "px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                                currency === "USD" 
                                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            USD ($)
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Messages */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={clsx(
                            "p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold select-none shadow-lg",
                            message.type === "success" 
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                                : "bg-red-500/15 border-red-500/30 text-red-400"
                        )}
                    >
                        <div className={clsx(
                            "w-2 h-2 rounded-full",
                            message.type === "success" ? "bg-emerald-400" : "bg-red-400"
                        )} />
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Subscription Summary Box */}
            {hasActiveSubscription && (
                <div className="neo-card p-6 border-violet-500/20 bg-gradient-to-r from-violet-950/15 via-[#0b132b]/80 to-[#020617] relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[200%] bg-gradient-to-l from-violet-500/5 to-transparent pointer-events-none" />
                    <div className="space-y-2 relative z-10">
                        <span className="px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase rounded-full tracking-widest">
                            Subscribed Member
                        </span>
                        <h3 className="text-lg font-extrabold text-white uppercase tracking-tight mt-1">
                            Current Plan: {user.subscription_plan}
                        </h3>
                        <p className="text-xs text-slate-400">
                            Your subscription status is <span className="text-emerald-400 font-bold uppercase">{user.subscription_status}</span> using <span className="text-white font-bold">{user.subscription_currency}</span> currency.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCancelModalOpen(true)}
                        className="px-6 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 relative z-10 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    >
                        Cancel Subscription
                    </button>
                </div>
            )}

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {plans.map(plan => {
                    const PlanIcon = plan.icon;
                    const isActive = user?.subscription_plan === plan.id;
                    const isPopular = plan.id === "professional"; // Highlight Pro plan
                    
                    return (
                        <motion.div 
                            key={plan.id}
                            whileHover={{ y: -8, transition: { duration: 0.2, ease: "easeOut" } }}
                            className={clsx(
                                "neo-card p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden",
                                isActive 
                                    ? "border-emerald-500 bg-gradient-to-b from-[#10b981]/5 to-[#0b1424] shadow-[0_0_30px_rgba(16,185,129,0.08)] scale-[1.02]" 
                                    : isPopular
                                    ? "border-violet-500/30 bg-gradient-to-b from-violet-600/5 to-[#090f1d] shadow-[0_0_40px_rgba(139,92,246,0.1)]"
                                    : "border-white/5 hover:border-white/10 hover:shadow-xl"
                            )}
                        >
                            {isActive && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase rounded-full tracking-widest shadow-md z-10">
                                    Active subscription
                                </span>
                            )}

                            {isPopular && !isActive && (
                                <span className="absolute top-0 right-0 px-3.5 py-1 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-[9px] font-black uppercase rounded-bl-xl tracking-widest shadow-md z-10">
                                    Most Popular
                                </span>
                            )}

                            <div>
                                <div className="flex justify-between items-start">
                                    <div className={clsx(
                                        "p-3 rounded-2xl border",
                                        plan.color === 'emerald' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                        plan.color === 'violet' ? "bg-violet-500/10 border-violet-500/20 text-violet-400" :
                                        "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
                                    )}>
                                        <PlanIcon size={22} />
                                    </div>
                                    
                                    <div className="text-right">
                                        <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price[currency]}</span>
                                        <span className="text-[10px] text-slate-500 block font-bold mt-[-2px]">/ MONTH</span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mt-4">{plan.name}</h3>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed min-h-[48px]">{plan.desc}</p>

                                <div className="h-px bg-white/5 my-4"></div>

                                <ul className="space-y-2">
                                    {plan.features.map((feat, index) => (
                                        <li key={index} className="flex items-start gap-2.5 text-xs text-slate-300">
                                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-6">
                                {isActive ? (
                                    <button 
                                        disabled
                                        className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircle size={14} /> Current Plan
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => submitUpgrade(plan.id)}
                                        disabled={isUpgrading}
                                        className={clsx(
                                            "w-full py-3 font-bold rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5",
                                            plan.color === 'emerald' ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950" :
                                            plan.color === 'violet' ? "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/25" :
                                            "bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-md shadow-fuchsia-600/25",
                                            isUpgrading && "opacity-75 cursor-not-allowed"
                                        )}
                                    >
                                        {isUpgrading && selectedPlan === plan.id ? (
                                            <>
                                                <Loader className="animate-spin" size={14} /> Redirecting...
                                            </>
                                        ) : (
                                            "Upgrade Plan"
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* B2B FAQs Accordion Grid */}
            <div className="neo-card p-6 md:p-8 border-white/5 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="text-violet-400" size={22} /> Frequently Asked Questions
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Everything you need to know about our IoT platform subscriptions, PayU security, and billing guidelines.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    {[
                        {
                            q: "How does the PayU payment gateway integration work?",
                            a: "When you click 'Upgrade Plan', our server generates a secure transaction token and hashes it using SHA-512 with a salt key hidden on the backend. This guarantees that your checkout info is tampered-proof. You are redirected to PayU to pay using UPI, card, or net banking, and redirected back automatically."
                        },
                        {
                            q: "What happens if I cancel my subscription?",
                            a: "Your account will downgrade back to the Free plan. All metrics data collected during the subscription remains safe, but device configurations exceeding the free quota (max 2 active microcontrollers) will be paused, and polling frequency will be normalized."
                        },
                        {
                            q: "Can I switch billing currencies after subscribing?",
                            a: "Billing currency is mapped on checkout. If you need to switch between INR (₹) and USD ($), you can downgrade and resubscribe using the alternative currency toggle at the top of the billing dashboard."
                        },
                        {
                            q: "Is there a long-term contract requirement?",
                            a: "No, all plans are billed on a month-to-month basis. You can cancel, upgrade, or downgrade your active SaaS control center subscription at any time directly through this portal."
                        }
                    ].map((faq, index) => (
                        <div key={index} className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2 hover:bg-white/10 transition-colors">
                            <h4 className="text-sm font-bold text-white">{faq.q}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cancel Subscription Confirmation Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
                        {/* Blur Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCancelModalOpen(false)}
                            className="absolute inset-0 bg-[#020617]/70 backdrop-blur-md"
                        />

                        {/* Modal Dialog */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-[#0b132b]/95 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
                        >
                            {/* Decorative background light */}
                            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-red-600/5 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 mx-auto bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center justify-center mb-4">
                                    <AlertTriangle size={32} className="text-red-400" />
                                </div>
                                
                                <h3 className="text-lg font-bold text-white mb-2">Cancel Subscription?</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                                    Are you sure you want to cancel your <strong className="text-white uppercase">{user?.subscription_plan}</strong> plan? Your telemetry metrics ingestion and custom analytics triggers will be instantly downgraded back to default Free limits.
                                </p>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsCancelModalOpen(false)}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
                                    >
                                        Keep My Plan
                                    </button>
                                    <button 
                                        onClick={submitCancellation}
                                        disabled={isCancelling}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/25 disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isCancelling ? (
                                            <>
                                                <Loader className="animate-spin" size={14} /> Processing...
                                            </>
                                        ) : (
                                            "Yes, Cancel"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </LayoutWrapper>
    );
};

export default Subscription;
