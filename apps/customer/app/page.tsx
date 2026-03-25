// ── Customer App Home Page ──────────────────────────────────────────────────
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import ShopCard from '@/components/ShopCard'
import LocationPicker from '@/components/LocationPicker'
import { CATEGORIES } from '@/lib/data'
import { supabase } from '../../../packages/data/src/supabase'

const BANNERS = [
    { bg: 'from-orange-500 to-red-500', emoji: '📱', title: '10% Off Mobile Repair', sub: 'Valid till March 31' },
    { bg: 'from-blue-500 to-cyan-500', emoji: '⚡', title: 'Free Wiring Inspection', sub: 'Book any electrician' },
    { bg: 'from-emerald-500 to-teal-500', emoji: '❄️', title: 'Summer AC Service', sub: 'Starting ₹599 only' },
]

export default function HomePage() {
    const [location, setLocation] = useState('Koramangala, Bangalore')
    const [isLocationOpen, setIsLocationOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [bannerIdx, setBannerIdx] = useState(0)
    const { user } = useAuth()
    const userName = user?.displayName ? user.displayName.split(' ')[0] : (user?.phone || 'there')
    const [position, setPosition] = useState<[number, number] | null>(null)
    const [shops, setShops] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLoc = localStorage.getItem('qf_location')
            if (savedLoc) setLocation(savedLoc)
            
            const savedPos = localStorage.getItem('qf_position')
            if (savedPos) setPosition(JSON.parse(savedPos))
        }
        
        const fetchShops = async () => {
            const { data } = await supabase.from('shops').select('*, services(*)')
            if (data) setShops(data)
            setLoading(false)
        }
        fetchShops()

        const timer = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000)
        return () => clearInterval(timer)
    }, [])
    
    const handleLocationSelect = (loc: string, pos?: [number, number]) => {
        setLocation(loc)
        localStorage.setItem('qf_location', loc)
        if (pos) {
            setPosition(pos)
            localStorage.setItem('qf_position', JSON.stringify(pos))
        }
    }

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

    const filteredShops = shops.map(shop => {
        let distance = null;
        if (position && shop.latitude && shop.longitude) {
            distance = getDistance(position[0], position[1], shop.latitude, shop.longitude)
        }
        return { ...shop, distance }
    }).filter(shop => {
        const matchCat = activeCategory === 'all' || shop.category?.includes(activeCategory)
        const matchSearch = !search || shop.name.toLowerCase().includes(search.toLowerCase()) ||
            shop.services?.some((s:any) => s.name.toLowerCase().includes(search.toLowerCase()))
            
        // Only show approved shops and optionally within a reasonable radius (e.g. 50km) if location is set
        const matchRadius = shop.distance === null || shop.distance < 50
        return matchCat && matchSearch && shop.is_approved && matchRadius
    }).sort((a, b) => {
        if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
        return 0;
    })

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="px-5 pt-12 pb-4" style={{ background: 'linear-gradient(160deg, #1A1A2E 0%, #0F3460 100%)' }}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-white/60 text-xs font-medium">Good morning,</p>
                        <h1 className="text-white text-xl font-black">Hey, {userName}! 👋</h1>
                    </div>
                    <Link href="/notifications" className="relative">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B35] rounded-full text-white text-[9px] font-bold flex items-center justify-center">0</span>
                    </Link>
                </div>

                {/* Location */}
                <button 
                    onClick={() => setIsLocationOpen(true)}
                    className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-4 w-full text-left active:scale-95 transition-transform hover:bg-white/20">
                    <svg width="14" height="14" fill="#FF6B35" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                    <span className="text-white text-xs font-medium flex-1 truncate">{location}</span>
                    <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                </button>

                {/* Search */}
                <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-lg">
                    <svg width="18" height="18" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search for services, shops..."
                        className="flex-1 text-gray-700 placeholder:text-gray-400 outline-none text-sm bg-transparent font-medium"
                    />
                </div>
            </div>

            <div className="px-5">
                {/* Banner Carousel */}
                <div className="mt-5 mb-5 overflow-hidden rounded-2xl">
                    <div className={`bg-gradient-to-r ${BANNERS[bannerIdx].bg} rounded-2xl p-5 flex items-center justify-between transition-all duration-500`}>
                        <div>
                            <p className="text-white font-black text-lg leading-tight">{BANNERS[bannerIdx].title}</p>
                            <p className="text-white/80 text-xs mt-1">{BANNERS[bannerIdx].sub}</p>
                            <button className="mt-3 bg-white text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full">Book Now</button>
                        </div>
                        <span className="text-6xl">{BANNERS[bannerIdx].emoji}</span>
                    </div>
                    <div className="flex gap-1.5 justify-center mt-2">
                        {BANNERS.map((_, i) => (
                            <div key={i} onClick={() => setBannerIdx(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === bannerIdx ? 'w-5 bg-[#FF6B35]' : 'w-1.5 bg-gray-300'}`} />
                        ))}
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-4">
                    <h2 className="font-bold text-[#1A1A2E] text-base mb-3">Services</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('all')}
                            className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl shrink-0 transition-all snap-start ${activeCategory === 'all' ? 'bg-[#FF6B35] shadow-md' : 'bg-gray-100'}`}
                        >
                            <span className="text-xl">🔍</span>
                            <span className={`text-[11px] font-semibold ${activeCategory === 'all' ? 'text-white' : 'text-gray-600'}`}>All</span>
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl shrink-0 transition-all snap-start ${activeCategory === cat.id ? 'shadow-md' : 'bg-gray-100'}`}
                                style={activeCategory === cat.id ? { background: cat.color } : {}}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                <span className={`text-[11px] font-semibold whitespace-nowrap ${activeCategory === cat.id ? 'text-white' : 'text-gray-600'}`}>
                                    {cat.label.split(' ')[0]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Nearby Shops */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-[#1A1A2E] text-base">
                            {activeCategory === 'all' ? 'Nearby Shops' : CATEGORIES.find(c => c.id === activeCategory)?.label}
                            <span className="text-gray-400 text-sm font-normal ml-2">({filteredShops.length})</span>
                        </h2>
                        <Link href="/shops" className="text-[#FF6B35] text-sm font-semibold">See all</Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredShops.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="text-5xl">🥺</span>
                            <p className="text-gray-500 mt-3 font-medium">No shops found here yet</p>
                            <p className="text-gray-400 text-sm px-10">Try an area like 'Bangalore' or search a different category.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {filteredShops.map((shop, i) => (
                                <div key={shop.id} className={`animate-slide-up animate-delay-${Math.min(i * 100, 300)}`}>
                                    <ShopCard shop={{
                                        ...shop,
                                        isApproved: shop.is_approved,
                                        isOpen: shop.is_open,
                                        openTime: shop.open_time,
                                        closeTime: shop.close_time,
                                        priceRange: shop.price_range
                                    }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <BottomNav />
            
            {/* Map Location Modal */}
            <LocationPicker 
                isOpen={isLocationOpen} 
                onClose={() => setIsLocationOpen(false)} 
                initialLocation={location}
                onSelect={handleLocationSelect} 
            />
        </div>
    )
}

