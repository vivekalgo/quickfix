'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookingStatus, supabase } from '@/lib/data'
import StatusBadge from '@/components/StatusBadge'

const STATUS_STEPS: BookingStatus[] = ['requested', 'accepted', 'on-the-way', 'in-progress', 'completed']

const STEP_INFO = {
    requested: { icon: '📋', label: 'Booking Requested', sub: 'Waiting for shop confirmation' },
    accepted: { icon: '✅', label: 'Booking Accepted', sub: 'Shop has confirmed your request' },
    'on-the-way': { icon: '🚗', label: 'Technician On the Way', sub: 'Your technician is heading to your location' },
    'in-progress': { icon: '🔧', label: 'Work In Progress', sub: 'Technician is currently working' },
    completed: { icon: '🎉', label: 'Service Completed', sub: 'Your service has been completed' },
    cancelled: { icon: '❌', label: 'Order Cancelled', sub: 'This booking was cancelled by you' },
}

export default function OrderTrackingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading order...</div>}>
            <OrderTrackingContent />
        </Suspense>
    )
}

function OrderTrackingContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    
    const [booking, setBooking] = useState<any>(null)
    const [shop, setShop] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        const fetchOrder = async () => {
            const { data } = await supabase.from('bookings').select('*, shops(*)').eq('id', id).single()
            if (data) {
                setBooking(data)
                setShop(data.shops)
            }
            setLoading(false)
        }
        if (id) fetchOrder()

        // Realtime status tracking
        const channel = supabase
            .channel(`booking-${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'bookings',
                    filter: `id=eq.${id}`
                },
                (payload) => {
                    console.log('Order status update:', payload)
                    setBooking((prev: any) => ({ ...prev, ...payload.new }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const handleCancel = async () => {
        setIsProcessing(true)
        try {
            const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
            if (error) throw error
            setBooking((prev:any) => ({ ...prev, status: 'cancelled' }))
            setShowConfirm(false)
        } catch (err: any) {
            alert('Error cancelling order: ' + (err.message || 'Unknown error'))
        } finally {
            setIsProcessing(false)
        }
    }

    const handleReschedule = () => {
        router.push(`/book?shopId=${shop?.id}&serviceId=${booking.service_id}`)
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading order...</div>

    if (!booking) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <span className="text-5xl">😕</span>
            <p className="mt-3 font-bold text-gray-600">Order not found</p>
            <button onClick={() => router.back()} className="mt-4 text-[#FF6B35] font-semibold">← Go back</button>
        </div>
    )

    const currentStepIdx = STATUS_STEPS.indexOf(booking.status as any)

    return (
        <div className="pb-10 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <div>
                        <h1 className="font-black text-[#1A1A2E] text-lg">Track Order</h1>
                        <p className="text-gray-400 text-xs">#{booking.id}</p>
                    </div>
                    <div className="ml-auto">
                        <StatusBadge status={booking.status as BookingStatus} />
                    </div>
                </div>
            </div>

            <div className="px-5 pt-5">
                {/* Map placeholder */}
                <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl h-44 mb-5 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <svg width="100%" height="100%"><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#4F46E5" strokeWidth="0.5" /></pattern><rect width="100%" height="100%" fill="url(#grid)" /></svg>
                    </div>
                    <div className="relative text-center">
                        <div className="relative inline-block">
                            <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white text-2xl shadow-xl">
                                {booking.status === 'on-the-way' ? '🚗' : booking.status === 'in-progress' ? '🔧' : '📍'}
                            </div>
                            {(booking.status === 'on-the-way' || booking.status === 'in-progress') && (
                                <div className="absolute inset-0 rounded-full bg-[#FF6B35]/30 animate-ping" />
                            )}
                        </div>
                        <p className="text-indigo-700 font-bold text-sm mt-2">
                            {booking.status === 'on-the-way' ? 'Technician is on the way!' : booking.status === 'in-progress' ? 'Work in progress at your location' : `📍 ${booking.address}`}
                        </p>
                        <p className="text-indigo-500 text-xs mt-1">Live tracking • {booking.distance || shop?.distance || 'N/A'} km away</p>
                    </div>
                </div>

                {/* Booking info */}
                <div className="bg-white rounded-2xl p-4 mb-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl overflow-hidden shrink-0">
                            {shop?.images?.[0] && <img src={shop.images[0]} alt={shop?.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A1A2E] truncate">{shop?.name || booking.shopName}</p>
                            <p className="text-gray-400 text-xs truncate">{booking.serviceName || 'Service'}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-black text-[#FF6B35] text-xl">₹{booking.service_price || booking.servicePrice}</p>
                            <p className="text-gray-400 text-xs">{booking.payment_method || booking.paymentMethod}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
                        <div><p className="text-gray-400 text-[11px] uppercase tracking-wider font-bold mb-1">Date & Time</p><p className="font-semibold text-sm text-[#1A1A2E]">{booking.date} • {booking.time}</p></div>
                        <div><p className="text-gray-400 text-[11px] uppercase tracking-wider font-bold mb-1">Address</p><p className="font-semibold text-sm text-[#1A1A2E] truncate">{booking.address?.split('\n')[0]}</p></div>
                    </div>
                </div>

                {/* Status Timeline / Cancelled State */}
                {booking.status === 'cancelled' ? (
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center animate-fade-in mb-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">❌</div>
                        <h2 className="text-xl font-black text-red-700 mb-2">Order Cancelled</h2>
                        <p className="text-red-600/70 text-sm font-medium">This booking has been successfully cancelled. You can reschedule this service if you change your mind.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <h3 className="font-bold text-[#1A1A2E] mb-4">Order Timeline</h3>
                        {STATUS_STEPS.map((status, idx) => {
                            const info = STEP_INFO[status]
                            const isDone = idx <= currentStepIdx
                            const isCurrent = idx === currentStepIdx
                            return (
                                <div key={status} className="flex gap-3 pb-4 last:pb-0">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${isDone ? 'bg-[#FF6B35] shadow-md' : 'bg-gray-100'}`}>
                                            {isDone ? info.icon : <span className="text-gray-400 text-xs font-bold">{idx + 1}</span>}
                                        </div>
                                        {idx < STATUS_STEPS.length - 1 && (
                                            <div className={`w-0.5 flex-1 mt-1 min-h-6 rounded-full ${idx < currentStepIdx ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                    <div className="pb-4">
                                        <p className={`font-semibold text-sm ${isDone ? 'text-[#1A1A2E]' : 'text-gray-400'}`}>{info.label}</p>
                                        <p className={`text-xs mt-0.5 ${isCurrent ? 'text-[#FF6B35] font-medium' : 'text-gray-400'}`}>{isCurrent ? '← Current Status' : info.sub}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Actions */}
                {booking.status === 'completed' && (
                    <div className="mt-4">
                        <button className="w-full bg-amber-50 border border-amber-200 text-amber-700 py-4 rounded-2xl font-bold shadow-sm active:scale-[0.98]">
                            ⭐ Rate & Review {shop?.name || booking.shopName}
                        </button>
                    </div>
                )}

                {booking.status === 'cancelled' && (
                    <div className="mt-6">
                        <button onClick={handleReschedule} className="w-full bg-[#FF6B35] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-transform">
                            📅 Re-book this Service
                        </button>
                    </div>
                )}

                {!['completed', 'cancelled'].includes(booking.status) && (
                    <div className="mt-6 flex flex-col gap-3">
                        <a href={`tel:${shop?.phone}`} className="block w-full bg-[#1A1A2E] shadow-xl shadow-indigo-900/20 text-white py-4 rounded-2xl font-black text-center text-sm active:scale-[0.98] transition-transform">
                            📞 Call {shop?.name || booking.shopName}
                        </a>
                        
                        {/* Only allow cancellation/rescheduling before the technician is marked as 'on-the-way' */}
                        {['requested', 'accepted'].includes(booking.status) && (
                            <div className="mt-1">
                                {showConfirm ? (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 animate-slide-up">
                                        <p className="text-red-700 font-bold mb-3 text-center">Are you sure you want to cancel?</p>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleCancel}
                                                disabled={isProcessing}
                                                className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm active:scale-95 disabled:opacity-50">
                                                {isProcessing ? 'Processing...' : 'Yes, Cancel Order'}
                                            </button>
                                            <button 
                                                onClick={() => setShowConfirm(false)}
                                                className="flex-1 py-3.5 bg-white border border-gray-200 text-[#1A1A2E] rounded-xl font-bold text-sm active:scale-95">
                                                No, Go Back
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button onClick={handleReschedule} className="flex-1 bg-white border border-gray-200 text-[#1A1A2E] py-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-transform">
                                            📅 Reschedule
                                        </button>
                                        <button onClick={() => setShowConfirm(true)} className="flex-1 bg-red-50 border border-red-100 text-red-600 py-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-transform">
                                            ❌ Cancel Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {['on-the-way', 'in-progress'].includes(booking.status) && (
                            <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl mt-1 text-center">
                                <p className="text-orange-800 text-xs font-semibold">Cancellations are no longer allowed as the technician is already dispatched.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
