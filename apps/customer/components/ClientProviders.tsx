'use client'

import { AuthProvider } from '@/lib/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import { usePathname } from 'next/navigation'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === '/login'

    return (
        <AuthProvider>
            {isLoginPage ? children : <AuthGuard>{children}</AuthGuard>}
        </AuthProvider>
    )
}
