import { useState } from "react";
import axios from "axios";
import { User, Save, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const OnboardingModal = () => {
    const { updateUser } = useAuth();
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) return;

        setLoading(true);
        setError("");

        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
                full_name: fullName
            });
            updateUser({ full_name: response.data.full_name });
            window.location.reload();
        } catch (err) {
            console.error("Failed to update profile", err);
            setError("Failed to save. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Welcome!</h2>
                    <p className="text-secondary">Please enter your name to complete your profile.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-secondary mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="input-field"
                            placeholder="e.g. John Doe"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Continue to Dashboard</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingModal;
