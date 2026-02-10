import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
    user: User | null
    session: Session | null
    role: 'admin' | 'manager' | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, session: null, role: null, loading: true })

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [role, setRole] = useState<'admin' | 'manager' | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) fetchRole(session.user.id)
            else setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) fetchRole(session.user.id)
            else {
                setRole(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()

            if (error) {
                // Handle case where profile doesn't exist yet (optional)
                console.error('Error fetching role:', error)
            } else {
                setRole(data?.role as 'admin' | 'manager')
            }
        } catch (error) {
            console.error('Error fetching role:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, session, role, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
