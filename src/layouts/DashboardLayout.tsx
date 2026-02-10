import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { LogOut, User, LayoutDashboard, ShieldCheck, FileText } from 'lucide-react'
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
        <div className="min-h-screen bg-secondary-900 text-white font-['Futura'] flex flex-col">
            <header className="bg-secondary-800/80 backdrop-blur-xl border-b border-secondary-600/30 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo / Title */}
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <img src="/snt.svg" alt="logo" />
                                </div>
                                <h1 className="text-lg font-medium tracking-wide hidden sm:block">
                                    Skillntell<span className="text-primary-400">Check-in</span>
                                </h1>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex items-center gap-1 sm:gap-2">
                                {role === 'admin' && (
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/admin')
                                            ? 'bg-primary-500/10 text-primary-400'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <ShieldCheck className="w-4 h-4 shrink-0" />
                                        <span className="hidden xs:inline">Admin</span>
                                    </button>
                                )}
                                {role === 'admin' && (
                                    <button
                                        onClick={() => navigate('/admin/reports')}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/admin/reports')
                                            ? 'bg-primary-500/10 text-primary-400'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4 shrink-0" />
                                        <span className="hidden xs:inline">Reports</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate('/manager')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/manager')
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                                    <span className="hidden xs:inline">Dashboard</span>
                                </button>
                            </nav>
                        </div>

                        {/* User Profile & Actions */}
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-secondary-800 rounded-full border border-secondary-600/30">
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
