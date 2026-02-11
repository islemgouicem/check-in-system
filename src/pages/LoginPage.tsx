/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'

const LoginPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (data.user) {
                toast.success('Welcome back!')
                navigate('/manager')
            }
        } catch (error: any) {
            toast.error(error.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-900 px-4 font-['Futura'] selection:bg-primary-500/30">
            {/* Background Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full"></div>
            <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary-500/10 blur-[120px] rounded-full"></div>

            <div className="max-w-md w-full relative lg:mt-8">
                {/* Logo Section */}
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="mx-auto h-20 w-20 flex items-center justify-center mb-8 relative group">
                        <img src="/snt.svg" alt="snt" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tighter mb-3">
                        Skillntell <span className="text-primary-500">Check-in</span>
                    </h1>
                    <p className="text-gray-500 font-medium tracking-tight">
                        Event Management System
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-secondary-800/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-secondary-600/30 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-200">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-primary-500/50 to-transparent"></div>

                    <form className="space-y-8" onSubmit={handleLogin}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-primary-400 transition-colors" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-secondary-900/50 border border-secondary-600/30 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-primary-400 transition-colors" />
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full pl-12 pr-12 py-4 bg-secondary-900/50 border border-secondary-600/30 rounded-2xl text-white  placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all font-medium"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-primary-400 transition-colors focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full group relative flex items-center justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-900 focus:ring-primary-500 transition-all shadow-xl shadow-primary-900/20 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                {loading ? 'AUTHENTICATING...' : 'SIGN IN ACCESS'}
                                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-xs text-gray-600 font-bold tracking-tight">
                            &copy; {new Date().getFullYear()} SKILLNTELL. ALL RIGHTS RESERVED.
                        </p>
                    </div>
                </div>

                {/* Footer Link (Optional) */}
                <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
                </div>
            </div>
        </div>
    )
}

export default LoginPage
