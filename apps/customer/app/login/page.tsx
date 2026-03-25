'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { supabase } from '@/lib/data'

export default function LoginPage() {
    const router = useRouter()
    const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

    const handleSendOtp = async () => {
        if (phone.length < 10) { setError('Enter a valid phone number'); return }
        setLoading(true)
        setError('')
        
        try {
            // Setup reCAPTCHA
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible'
                })
            }
            
            const formattedPhone = `+91${phone}`
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier)
            setConfirmationResult(confirmation)
            setStep('otp')
        } catch (err: any) {
            console.error('Phone Auth Error:', err)
            setError(err.message || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (otp.length < 6) { setError('Enter the 6-digit OTP'); return }
        if (!confirmationResult) { setError('Please request OTP first'); return }
        
        setLoading(true)
        setError('')
        
        try {
            const result = await confirmationResult.confirm(otp)
            const firebaseUser = result.user

            // Check if user already exists in Supabase
            const { data: existingUser } = await supabase.from('users').select('*').eq('id', firebaseUser.uid).single()

            if (existingUser && existingUser.name !== 'User') {
                router.push('/')
            } else {
                setStep('name')
            }
        } catch (err: any) {
            console.error('OTP Verify Error:', err)
            setError('Invalid OTP code')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveName = async () => {
        if (name.trim().length < 2) { setError('Please enter your full name'); return }
        setLoading(true)
        setError('')

        try {
            const user = auth.currentUser
            if (!user) throw new Error('No authenticated user found')

            // Update in Supabase
            const { error: updateError } = await supabase.from('users').update({ name }).eq('id', user.uid)
            if (updateError) throw updateError

            router.push('/')
        } catch (err: any) {
            console.error('Save Name Error:', err)
            setError('Failed to save name. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)' }}>
            {/* Brand Header */}
            <div className="flex flex-col items-center justify-center flex-1 px-8 pt-16 pb-8">
                <div className="mb-6 animate-slide-up">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #FF6B35, #E85A24)' }}>
                        <span className="text-4xl">⚡</span>
                    </div>
                    <h1 className="text-4xl font-black text-white text-center tracking-tight">QuickFix</h1>
                    <p className="text-gray-400 text-center mt-1 font-medium">Hyperlocal repair services</p>
                </div>

                <div className="text-center mb-8 animate-fade-in animate-delay-100">
                    <p className="text-white/80 text-sm leading-relaxed">Find trusted repair experts <br /> near you – instantly.</p>
                </div>

                {/* Card */}
                <div className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 animate-slide-up animate-delay-200">
                    {step === 'phone' ? (
                        <>
                            <h2 className="text-white font-bold text-xl mb-1">Welcome 👋</h2>
                            <p className="text-white/60 text-sm mb-5">Enter your phone number to continue</p>

                            <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3 border border-white/20 mb-4">
                                <span className="text-white font-semibold text-sm">🇮🇳 +91</span>
                                <div className="w-px h-5 bg-white/20" />
                                <input
                                    type="tel"
                                    maxLength={10}
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter phone number"
                                    className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm font-medium"
                                />
                            </div>

                            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                            <button onClick={handleSendOtp} disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
                                style={{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #FF6B35, #E85A24)' }}>
                                {loading ? 'Sending OTP...' : 'Get OTP →'}
                            </button>
                        </>
                    ) : step === 'otp' ? (
                        <>
                            <button onClick={() => setStep('phone')} className="text-white/60 text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
                                ← Back
                            </button>
                            <h2 className="text-white font-bold text-xl mb-1">Verify OTP 🔐</h2>
                            <p className="text-white/60 text-sm mb-5">Sent to +91 {phone}</p>

                            <div className="flex gap-2 mb-4 justify-center">
                                {[0, 1, 2, 3, 4, 5].map(i => (
                                    <div key={i}
                                        className="w-11 h-12 flex items-center justify-center text-xl font-bold text-white rounded-xl border-2 transition-colors"
                                        style={{ borderColor: otp[i] ? '#FF6B35' : 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)' }}>
                                        {otp[i] || ''}
                                    </div>
                                ))}
                            </div>

                            <input
                                type="number"
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value.slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 outline-none text-center text-xl font-bold tracking-widest mb-4"
                            />

                            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                            <button onClick={handleVerifyOtp} disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
                                style={{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #FF6B35, #E85A24)' }}>
                                {loading ? 'Verifying...' : 'Verify & Continue →'}
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-white font-bold text-xl mb-1">One last thing! 👤</h2>
                            <p className="text-white/60 text-sm mb-5">What's your full name?</p>

                            <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3 border border-white/20 mb-4">
                                <span className="text-xl">✨</span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm font-medium"
                                />
                            </div>

                            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

                            <button onClick={handleSaveName} disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95"
                                style={{ background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #FF6B35, #E85A24)' }}>
                                {loading ? 'Saving...' : 'Get Started →'}
                            </button>
                        </>
                    )}
                </div>

                <div id="recaptcha-container"></div>
            </div>

            {/* Features */}
            <div className="px-6 pb-12">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { icon: '📍', label: 'Nearby Shops' },
                        { icon: '⚡', label: 'Instant Booking' },
                        { icon: '⭐', label: 'Verified Pros' },
                    ].map(f => (
                        <div key={f.label} className="text-center bg-white/5 rounded-2xl py-3 border border-white/10">
                            <div className="text-2xl mb-1">{f.icon}</div>
                            <p className="text-white/70 text-[11px] font-medium">{f.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// Add TS declaration for window.recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
