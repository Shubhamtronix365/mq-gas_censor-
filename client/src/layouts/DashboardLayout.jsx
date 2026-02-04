import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Server, User, Menu, X } from "lucide-react";
import { clsx } from 'clsx';

const DashboardLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <button
                onClick={() => {
                    navigate(to);
                    setMobileMenuOpen(false);
                }}
                className={clsx(
                    "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full",
                    isActive
                        ? "bg-primary text-white shadow-md font-medium"
                        : "text-secondary hover:bg-gray-100 hover:text-primary"
                )}
            >
                <Icon size={20} />
                <span>{label}</span>
            </button>
        )
    }

    return (
        <div className="flex h-screen bg-background relative overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-border p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold tracking-tight text-primary">TRONIX<span className="font-light">365</span></span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 -mr-2 text-secondary hover:text-primary rounded-lg"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Backdrop for mobile */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col shadow-2xl md:shadow-none",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-8 hidden md:block">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">TRONIX<span className="font-light">365</span></h1>
                    <p className="text-xs text-secondary mt-1 tracking-widest uppercase">Indianiiot</p>
                </div>

                {/* Mobile Sidebar Header */}
                <div className="p-6 md:hidden flex justify-between items-center border-b border-border">
                    <h1 className="text-xl font-bold tracking-tight text-primary">Menu</h1>
                    <button onClick={() => setMobileMenuOpen(false)}>
                        <X size={20} className="text-secondary" />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-6 md:mt-0">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem to="/devices" icon={Server} label="Devices" />
                    <NavItem to="/profile" icon={User} label="Profile" />
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 text-danger hover:bg-red-50 rounded-xl w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 md:pt-8 w-full">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
