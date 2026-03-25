import type { Metadata } from 'next'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'

export const metadata: Metadata = {
    title: 'QuickFix - Local Repair Services',
    description: 'Find and book trusted repair services near you — mobile, laptop, electrician, plumber, AC repair and more.',
    keywords: 'repair services, local repair, mobile repair, plumber, electrician, QuickFix',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" />
            </head>
            <body>
                <div className="app-container">
                    <ClientProviders>
                        {children}
                    </ClientProviders>
                </div>
            </body>
        </html>
    )
}
