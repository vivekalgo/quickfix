'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/data'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

export default function ShopDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    
    const [shop, setShop] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services')
    const [imgIdx, setImgIdx] = useState(0)

    useEffect(() => {
        const fetchShop = async () => {
             const { data } = await supabase.from('shops').select('*, services(*), reviews(*, users(name))').eq('id', id).single()
             
             let distance = null
             const savedPos = localStorage.getItem('qf_position')
             if (savedPos && data?.latitude && data?.longitude) {
                 const pos = JSON.parse(savedPos)
                 distance = getDistance(pos[0], pos[1], data.latitude, data.longitude)
             }
             
             setShop({ ...data, distance })
             setLoading(false)
        }
        if (id) fetchShop()
    }, [id])

    // Haversine distance formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return Number((R * c).toFixed(1));
    }

    if (loading) return <div className="p-10 flex flex-col items-center justify-center min-h-screen text-gray-400 font-bold animate-pulse">Loading shop specifics...</div>

    if (!shop) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <span className="text-6xl mb-4">😕</span>
            <p className="text-[#1A1A2E] text-xl font-black">Shop not found</p>
            <p className="text-gray-500 text-sm mt-2 max-w-[250px] text-center">We couldn't find the shop you're looking for. It may have been removed or the link is invalid.</p>
            <button onClick={() => router.back()} className="mt-8 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-bold active:scale-95 transition-transform hover:bg-gray-300">← Go back</button>
        </div>
    )

    const stars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}>★</span>
        ))
    }

    return (
        <div className="pb-28">
            {/* Image gallery */}
            <div className="relative h-64 bg-gray-200 overflow-hidden">
                <img
                    src={shop.images?.[imgIdx] || shop.images?.[0] || 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800'}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                />
                {/* Back + share buttons */}
                <div className="absolute top-12 left-0 right-0 px-4 flex justify-between">
                    <button onClick={() => router.back()} className="w-10 h-10 glass rounded-full flex items-center justify-center shadow">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button className="w-10 h-10 glass rounded-full flex items-center justify-center shadow">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                    </button>
                </div>
                {/* Image dots */}
                {shop.images?.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {shop.images.map((_:any, i:number) => (
                            <button key={i} onClick={() => setImgIdx(i)}
                                className={`h-1.5 rounded-full transition-all ${i === imgIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
                        ))}
                    </div>
                )}
                {/* Open/Closed */}
                <div className="absolute bottom-3 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${shop.is_open ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-200'}`}>
                        {shop.is_open ? '● Open Now' : '● Closed'}
                    </span>
                </div>
            </div>

            {/* Shop info card */}
            <div className="bg-white px-5 pt-5 pb-4 -mt-4 rounded-t-3xl relative">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h1 className="text-[#1A1A2E] font-black text-xl leading-tight">{shop.name}</h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                            <svg width="12" height="12" fill="#FF6B35" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            {shop.address}
                        </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                        <div className="flex items-center gap-1 justify-end">
                            <span className="text-amber-400 font-bold">★</span>
                            <span className="font-black text-lg text-[#1A1A2E]">{shop.rating}</span>
                        </div>
                        <p className="text-gray-400 text-xs">{shop.total_reviews || 0} reviews</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-4 mb-4 py-3 border-y border-gray-100">
                    <div className="text-center flex-1">
                        <p className="font-bold text-[#1A1A2E] text-sm">{shop.distance != null ? `${shop.distance} km` : 'N/A'}</p>
                        <p className="text-gray-400 text-xs">Distance</p>
                    </div>
                    <div className="text-center flex-1 border-x border-gray-100">
                        <p className="font-bold text-[#1A1A2E] text-sm">{shop.price_range || 'Varies'}</p>
                        <p className="text-gray-400 text-xs">Price Range</p>
                    </div>
                    <div className="text-center flex-1">
                        <p className="font-bold text-[#1A1A2E] text-sm">{shop.open_time || '09:00 AM'}</p>
                        <p className="text-gray-400 text-xs">Opens at</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 mb-4 bg-gray-100 rounded-2xl p-1">
                    {(['services', 'reviews'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-[#1A1A2E] shadow-sm' : 'text-gray-500'}`}>
                            {tab} {tab === 'services' ? `(${shop.services?.length || 0})` : `(${shop.reviews?.length || 0})`}
                        </button>
                    ))}
                </div>

                {/* Services */}
                {activeTab === 'services' && (
                    <div className="flex flex-col gap-3">
                        {shop.services?.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No services listed yet.</p> : null}
                        {shop.services?.map((service:any) => (
                            <div key={service.id} className="flex items-center justify-between bg-gray-50 rounded-2xl p-4 hover:bg-orange-50 transition-colors group">
                                <div className="flex-1">
                                    <p className="font-semibold text-[#1A1A2E] text-sm">{service.name}</p>
                                    <p className="text-gray-400 text-xs mt-0.5">{service.description}</p>
                                    <p className="text-gray-500 text-xs mt-1">⏱ {service.duration}</p>
                                </div>
                                <div className="text-right shrink-0 ml-4">
                                    <p className="font-black text-[#FF6B35] text-lg">₹{service.price}</p>
                                    <Link href={`/book/${shop.id}?serviceId=${service.id}`}>
                                        <button className="mt-1 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full active:scale-95 transition-transform">
                                            Book
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reviews */}
                {activeTab === 'reviews' && (
                    <div className="flex flex-col gap-3">
                        {/* Rating summary */}
                        <div className="bg-orange-50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-5xl font-black text-[#FF6B35]">{shop.rating}</p>
                                <div className="flex gap-0.5 mt-1 justify-center">{stars(shop.rating)}</div>
                                <p className="text-gray-400 text-xs mt-1">{shop.total_reviews || 0} reviews</p>
                            </div>
                            <div className="flex-1">
                                {[5, 4, 3, 2, 1].map(n => (
                                    <div key={n} className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500 w-2">{n}</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${n === 5 ? 60 : n === 4 ? 25 : n === 3 ? 10 : 5}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {shop.reviews?.length === 0 ? <p className="text-center text-gray-400 py-10 text-sm">No reviews yet.</p> : null}
                        {shop.reviews?.map((review:any) => (
                            <div key={review.id} className="bg-gray-50 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
                                        {review.users?.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-[#1A1A2E]">{review.users?.name || 'User'}</p>
                                        <div className="flex gap-0.5">{stars(review.rating)}</div>
                                    </div>
                                    <span className="ml-auto text-xs text-gray-400">{review.createdAt}</span>
                                </div>
                                <p className="text-gray-600 text-sm">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky CTA */}
            <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 z-40">
                <div className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-xl border border-gray-100 flex gap-3">
                    <a href={`tel:${shop.phone}`} className="flex-1 border-2 border-[#FF6B35] text-[#FF6B35] py-3 rounded-xl font-bold text-sm text-center flex items-center justify-center gap-2">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Call
                    </a>
                    <Link href={`/book/${shop.id}`} className="flex-2 flex-1">
                        <button className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
                            🔧 Book Service
                        </button>
                    </Link>
                </div>
            </div>
            <BottomNav />
        </div>
    )
}
