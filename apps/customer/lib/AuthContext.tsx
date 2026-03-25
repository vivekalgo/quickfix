'use client'
// AuthContext - wraps Firebase onAuthStateChanged into a React context
// Also syncs the user record to Supabase on first sign-in.
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react'
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase'
import { supabase } from '../../../packages/data/src/supabase'

interface AuthUser {
    uid: string
    phone: string | null
    displayName: string | null
    email: string | null
    role: string
}

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    signOut: () => Promise<void>
    updateProfile: (updates: { name: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    signOut: async () => {},
    updateProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const authUser: AuthUser = {
                    uid: firebaseUser.uid,
                    phone: firebaseUser.phoneNumber,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    role: 'customer',
                }
                setUser(authUser)

                // Upsert user record in Supabase so existing data queries work with the real UID
                const { data: existingUser } = await supabase.from('users').select('*').eq('id', firebaseUser.uid).single()
                
                if (!existingUser) {
                    await supabase.from('users').insert({
                        id: firebaseUser.uid,
                        phone: firebaseUser.phoneNumber ?? '',
                        name: firebaseUser.displayName ?? 'User',
                        role: 'customer',
                    })
                    setUser(prev => prev ? { ...prev, displayName: firebaseUser.displayName || 'User', role: 'customer' } : null)
                } else {
                    setUser(prev => prev ? { ...prev, displayName: existingUser.name, role: existingUser.role } : null)
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    const signOut = async () => {
        await firebaseSignOut(auth)
    }

    const updateProfile = async (updates: { name: string }) => {
        if (!user) return
        const { error } = await supabase.from('users').update({ name: updates.name }).eq('id', user.uid)
        if (error) throw error
        setUser(prev => prev ? { ...prev, displayName: updates.name } : null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
