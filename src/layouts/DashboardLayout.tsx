import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { LogOut, User, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DashboardLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, role } = useAuth()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen bg-[#080808] text-white font-['Futura'] flex flex-col">
            <header className="bg-[#121212] border-b border-[#2A2A2A] sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo / Title */}
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                                    <span className="font-bold text-white">S</span>
                                </div>
                                <h1 className="text-lg font-medium tracking-wide hidden sm:block">
                                    Skillntell<span className="text-primary-400">Check-in</span>
                                </h1>
                            </div>

                            {/* Navigation Links */}
                            <nav className="hidden md:flex items-center gap-1">
                                {role === 'admin' && (
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin')
                                            ? 'bg-primary-500/10 text-primary-400'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" />
                                            Admin
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate('/manager')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/manager')
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" />
                                        Dashboard
                                    </div>
                                </button>
                            </nav>
                        </div>

                        {/* User Profile & Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-[#1A1A1A] rounded-full border border-[#2A2A2A]">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                                    <User className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-xs text-gray-300 pr-1">{user?.email}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    )
}

export default DashboardLayout
