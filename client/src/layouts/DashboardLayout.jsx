import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard, Server, User } from "lucide-react";
import { clsx } from 'clsx';

const DashboardLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const isActive = location.pathname === to;
        return (
            <button
                onClick={() => navigate(to)}
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
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col">
                <div className="p-8">
                    <h1 className="text-2xl font-bold tracking-tight text-primary">TRONIX<span className="font-light">365</span></h1>
                    <p className="text-xs text-secondary mt-1 tracking-widest uppercase">Indianiiot</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
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

            {/* Mobile Header (Visible on small screens) */}
            {/* TODO: Add proper mobile menu toggling */}

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
