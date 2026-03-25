'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/data'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/lib/AuthContext'

const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM']
const DATES = [0, 1, 2, 3, 4, 5, 6].map(n => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return {
        day: d.toLocaleDateString('en', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('en', { month: 'short' }),
        full: d.toISOString().split('T')[0],
    }
})

export default function BookPage() {
    const { shopId } = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    
    const [shop, setShop] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [step, setStep] = useState(1)
    const [selectedService, setSelectedService] = useState<string>(searchParams.get('serviceId') || '')
    const [selectedDate, setSelectedDate] = useState(DATES[1].full)
    const [selectedTime, setSelectedTime] = useState('')
    const [address, setAddress] = useState('')
    const [contactNumber, setContactNumber] = useState('')
    const [description, setDescription] = useState('')
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash')
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [bookingId, setBookingId] = useState('')

    useEffect(() => {
        const fetchShop = async () => {
             const { data } = await supabase.from('shops').select('*, services(*)').eq('id', shopId).single()
             setShop(data)
             setLoading(false)
        }
        if (shopId) fetchShop()
    }, [shopId])

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [authLoading, user, router])

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 font-bold animate-pulse">Initializing Booking...</div>
    if (!shop) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Shop not found.</div>
    
    const service = shop.services?.find((s:any) => s.id === selectedService)

    const handleSubmit = async () => {
        if (!user) {
            router.push('/login')
            return
        }
        setSubmitting(true)
        
        // Get GPS location if available
        const locMap = localStorage.getItem('qf_user_location')
        let finalAddress = address
        if (locMap) {
            try {
                const { lat, lng } = JSON.parse(locMap)
                finalAddress += `\n(GPS: https://maps.google.com/?q=${lat},${lng})`
            } catch (e) {}
        }

        const finalInstructions = contactNumber ? `📱 Alternate Contact: ${contactNumber}\n💬 ${description}` : description

        // Ensure the user exists in Supabase with correct phone from Firebase
        const phone = user.phone || ''
        await supabase.from('users').upsert({
            id: user.uid,
            phone,
            name: user.displayName || 'Customer',
            role: 'customer',
        }, { onConflict: 'id' })

        const res = await fetch('/api/bookings', {
            method: 'POST',
            body: JSON.stringify({
                userId: user.uid,
                userName: user.displayName || 'Customer',
                shopId: shop.id,
                shopName: shop.name,
                serviceId: selectedService,
                serviceName: service?.name || '',
                servicePrice: service?.price || 0,
                date: selectedDate,
                time: selectedTime,
                address: finalAddress,
                description: finalInstructions,
                paymentMethod,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        setSubmitting(false)
        setBookingId(data.booking.id)
        setSubmitted(true)
    }

    if (submitted) return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
            <div className="text-center animate-slide-up">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">✅</span>
                </div>
                <h2 className="text-2xl font-black text-[#1A1A2E] mb-2">Booking Confirmed!</h2>
                <p className="text-gray-500 text-sm mb-1">Your request has been sent to</p>
                <p className="text-[#FF6B35] font-bold text-lg">{shop.name}</p>
                <div className="bg-gray-50 rounded-2xl p-4 mt-5 text-left">
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Booking ID</span><span className="font-bold text-[#1A1A2E]">#{bookingId}</span></div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Service</span><span className="font-semibold">{service?.name}</span></div>
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Date & Time</span><span className="font-semibold">{selectedDate} at {selectedTime}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Amount</span><span className="font-bold text-[#FF6B35]">₹{service?.price}</span></div>
                </div>
                <button onClick={() => router.push('/orders')} className="mt-6 w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] text-white py-4 rounded-2xl font-bold">
                    Track My Order →
                </button>
                <button onClick={() => router.push('/')} className="mt-3 w-full border-2 border-gray-200 text-gray-600 py-4 rounded-2xl font-semibold text-sm">
                    Back to Home
                </button>
            </div>
        </div>
    )

    return (
        <div className="pb-10 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-1">
                    <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div>
                        <h1 className="font-black text-[#1A1A2E] text-lg">Book Service</h1>
                        <p className="text-gray-400 text-xs">{shop.name}</p>
                    </div>
                </div>
                {/* Progress */}
                <div className="flex gap-1 mt-3">
                    {[1, 2, 3].map(n => (
                        <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${n <= step ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />
                    ))}
                </div>
                <p className="text-gray-400 text-xs mt-1.5">Step {step} of 3 — {step === 1 ? 'Select Service & Time' : step === 2 ? 'Add Address & Details' : 'Confirm & Pay'}</p>
            </div>

            <div className="px-5 pt-5">
                {/* Step 1 */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-[#1A1A2E] mb-3">Select a Service</h3>
                        <div className="flex flex-col gap-2 mb-5">
                            {shop.services?.length === 0 ? <p className="text-gray-400 text-sm">No services available.</p> : null}
                            {shop.services?.map((sv:any) => (
                                <button key={sv.id} onClick={() => setSelectedService(sv.id)}
                                    className={`text-left p-4 rounded-2xl border-2 transition-all ${selectedService === sv.id ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 bg-white'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-[#1A1A2E] text-sm">{sv.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{sv.description}</p>
                                            <p className="text-gray-400 text-xs mt-1">⏱ {sv.duration}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-[#FF6B35] text-lg">₹{sv.price}</p>
                                            {selectedService === sv.id && <span className="text-[10px] text-emerald-600 font-bold">✓ Selected</span>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <h3 className="font-bold text-[#1A1A2E] mb-3">Select Date</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                            {DATES.map(d => (
                                <button key={d.full} onClick={() => setSelectedDate(d.full)}
                                    className={`flex flex-col items-center px-3 py-2.5 rounded-2xl shrink-0 border-2 transition-all ${selectedDate === d.full ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 bg-white'}`}>
                                    <span className={`text-xs font-medium ${selectedDate === d.full ? 'text-[#FF6B35]' : 'text-gray-400'}`}>{d.day}</span>
                                    <span className={`text-lg font-black ${selectedDate === d.full ? 'text-[#FF6B35]' : 'text-[#1A1A2E]'}`}>{d.date}</span>
                                    <span className={`text-xs ${selectedDate === d.full ? 'text-[#FF6B35]' : 'text-gray-400'}`}>{d.month}</span>
                                </button>
                            ))}
                        </div>

                        <h3 className="font-bold text-[#1A1A2E] mb-3">Select Time</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {TIME_SLOTS.map(t => (
                                <button key={t} onClick={() => setSelectedTime(t)}
                                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${selectedTime === t ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]' : 'border-gray-100 bg-white text-gray-600'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>

                        <button onClick={() => {
                            if (!selectedService) return alert('Please select a service')
                            if (!selectedTime) return alert('Please select a time slot')
                            setStep(2)
                        }} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-transform">
                            Continue →
                        </button>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-[#1A1A2E] mb-3">Your Address</h3>
                        <textarea
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Enter your full address with landmark..."
                            rows={3}
                            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#FF6B35] transition-colors mb-4 resize-none"
                        />

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {['Home', 'Office', 'Hotel', 'Other'].map(loc => (
                                <button key={loc} onClick={() => setAddress(`${loc} - ${address.split(' - ').pop() || ''}`)}
                                    className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white text-sm font-medium text-gray-600 hover:border-[#FF6B35] transition-colors">
                                    <span>{loc === 'Home' ? '🏠' : loc === 'Office' ? '🏢' : loc === 'Hotel' ? '🏨' : '📍'}</span>
                                    {loc}
                                </button>
                            ))}
                        </div>

                        <h3 className="font-bold text-[#1A1A2E] mb-3">Alternate Contact Number</h3>
                        <input
                            type="text"
                            value={contactNumber}
                            onChange={e => setContactNumber(e.target.value)}
                            placeholder="e.g. +91 9876543210 (Optional)"
                            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#FF6B35] transition-colors mb-4"
                        />

                        <h3 className="font-bold text-[#1A1A2E] mb-3">Problem Description</h3>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe the issue in detail... (e.g. 'My iPhone 14 screen cracked from the right side, touch working but display is broken')"
                            rows={4}
                            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#FF6B35] transition-colors mb-6 resize-none"
                        />
                        <button onClick={() => {
                            if (!address.trim()) return alert('Please enter your address')
                            setStep(3)
                        }} className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] text-white py-4 rounded-2xl font-bold text-base">
                            Continue →
                        </button>
                    </div>
                )}

                {/* Step 3 - Confirm */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-[#1A1A2E] mb-4">Booking Summary</h3>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                    <span className="text-2xl">🔧</span>
                                </div>
                                <div>
                                    <p className="font-bold text-[#1A1A2E]">{shop.name}</p>
                                    <p className="text-gray-400 text-xs">{service?.name}</p>
                                </div>
                                <p className="ml-auto font-black text-[#FF6B35] text-xl">₹{service?.price}</p>
                            </div>
                            {[
                                { icon: '📅', label: 'Date', value: `${selectedDate} at ${selectedTime}` },
                                { icon: '📍', label: 'Address', value: address },
                                { icon: '⏱', label: 'Duration', value: service?.duration || '' },
                            ].map(row => (
                                <div key={row.label} className="flex items-start gap-3 mb-3">
                                    <span className="text-lg">{row.icon}</span>
                                    <div>
                                        <p className="text-gray-400 text-xs">{row.label}</p>
                                        <p className="text-[#1A1A2E] text-sm font-semibold">{row.value}</p>
                                    </div>
                                </div>
                            ))}
                            {description && (
                                <div className="flex items-start gap-3 mt-1">
                                    <span className="text-lg">💬</span>
                                    <div>
                                        <p className="text-gray-400 text-xs">Problem</p>
                                        <p className="text-[#1A1A2E] text-sm">{description}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <h3 className="font-bold text-[#1A1A2E] mb-3">Payment Method</h3>
                        <div className="flex gap-3 mb-5">
                            {[
                                { key: 'cash', icon: '💵', label: 'Cash on Delivery' },
                                { key: 'upi', icon: '📱', label: 'UPI / Online' },
                            ].map(pm => (
                                <button key={pm.key} onClick={() => setPaymentMethod(pm.key as any)}
                                    className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${paymentMethod === pm.key ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 bg-white'}`}>
                                    <span className="text-2xl">{pm.icon}</span>
                                    <p className={`text-xs font-semibold ${paymentMethod === pm.key ? 'text-[#FF6B35]' : 'text-gray-600'}`}>{pm.label}</p>
                                </button>
                            ))}
                        </div>

                        <div className="bg-orange-50 rounded-2xl p-4 mb-5 flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Amount</span>
                            <span className="text-[#FF6B35] font-black text-2xl">₹{service?.price}</span>
                        </div>

                        <button onClick={handleSubmit} disabled={submitting}
                            className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-all shadow-lg">
                            {submitting ? 'Confirming...' : '✅ Confirm Booking'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
