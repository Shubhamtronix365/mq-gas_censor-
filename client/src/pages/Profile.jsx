import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { User, Phone, Mail, Save, Loader, Camera, Shield, Trash2, Building, Briefcase } from "lucide-react";

const Profile = () => {
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState({
        email: "",
        full_name: "",
        phone_number: "",
        organization: "Tronix365", // Default/Placeholder
        job_title: "IoT Engineer"      // Default/Placeholder
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`);
            setProfile(prev => ({
                ...prev,
                email: response.data.email,
                full_name: response.data.full_name || "",
                phone_number: response.data.phone_number || ""
            }));
        } catch (error) {
            console.error("Error fetching profile:", error);
            setMessage({ type: "error", text: "Failed to load profile data." });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // Only send backend-supported fields
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
                full_name: profile.full_name,
                phone_number: profile.phone_number
            });

            setMessage({ type: "success", text: "Profile updated successfully!" });

            // In a real app, we'd save organization/title here too if backend supported it
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) return <div className="text-center py-20">Loading...</div>;

    const initials = profile.full_name
        ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : "U";

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary">Account Settings</h1>
                <p className="text-secondary">Manage your identity and preferences</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center shadow-sm animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Identity & Avatar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-border text-center">
                        <div className="relative inline-block mb-4 group">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg mx-auto overflow-hidden">
                                {initials}
                            </div>
                            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-primary transition-colors">
                                <Camera size={18} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold text-primary">{profile.full_name || "User"}</h2>
                        <p className="text-sm text-secondary mb-4">{profile.job_title}</p>
                        <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            <Shield size={12} className="mr-1" />
                            Administrator
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                        <h3 className="font-semibold text-gray-900 mb-4">Account Status</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-secondary">Member since</span>
                                <span className="font-medium">Feb 2024</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-secondary">Last Login</span>
                                <span className="font-medium">Just now</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center text-green-600 text-sm font-medium">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Active Account
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                            <p className="text-sm text-secondary">Update your personal details here.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="full_name"
                                            value={profile.full_name}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Briefcase size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="job_title"
                                            value={profile.job_title}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                            placeholder="e.g. Developer"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone_number"
                                            value={profile.phone_number}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Building size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="organization"
                                            value={profile.organization}
                                            onChange={handleChange}
                                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                            placeholder="Company Name"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-gray-50 border-t border-border flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary flex items-center space-x-2 px-6 py-2.5 shadow-md hover:shadow-lg transition-all"
                            >
                                {saving ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-red-600 mb-1">Danger Zone</h3>
                            <p className="text-sm text-secondary mb-4">Irreversible actions for your account.</p>

                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                                <div>
                                    <h4 className="font-medium text-red-900">Delete Account</h4>
                                    <p className="text-xs text-red-700 mt-1">Permanently remove your account and all data.</p>
                                </div>
                                <button className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
