'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../packages/data/src/supabase'

type View = 'dashboard' | 'users' | 'shops' | 'orders' | 'analytics'

const NAV = [
    { id: 'dashboard' as View, icon: '📊', label: 'Dashboard' },
    { id: 'users' as View, icon: '👥', label: 'Manage Users' },
    { id: 'shops' as View, icon: '🏪', label: 'Manage Shops' },
    { id: 'orders' as View, icon: '📋', label: 'Order Monitoring' },
    { id: 'analytics' as View, icon: '📈', label: 'Analytics' },
]

function DashboardView({ users, shops, bookings }: any) {
    const totalRevenue = bookings.filter((b:any) => b.status === 'completed').reduce((s:any, b:any) => s + Number(b.servicePrice), 0)
    const stats = [
        { label: 'Total Users', value: users.filter((u:any) => u.role === 'customer').length, icon: '👥', color: '#6366F1', bg: '#EEF2FF', trend: '+12%' },
        { label: 'Active Shops', value: shops.filter((s:any) => s.is_approved).length, icon: '🏪', color: '#FF6B35', bg: '#FFF3EE', trend: '+3 new' },
        { label: 'Total Orders', value: bookings.length, icon: '📋', color: '#0EA5E9', bg: '#F0F9FF', trend: '+25%' },
        { label: 'Revenue', value: `₹${totalRevenue}`, icon: '💰', color: '#059669', bg: '#ECFDF5', trend: '+18%' },
    ]
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Platform Overview</h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: s.bg }}>{s.icon}</div>
                            <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{s.trend}</span>
                        </div>
                        <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-[#1A1A2E]">Pending Shop Approvals</h3>
                        <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                            {shops.filter((s:any) => !s.is_approved).length} pending
                        </span>
                    </div>
                    {shops.filter((s:any) => !s.is_approved).length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">All shops are approved ✅</div>
                    ) : (
                        shops.filter((s:any) => !s.is_approved).slice(0, 3).map((s:any) => (
                            <div key={s.id} className="p-4 border-b border-gray-50 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm">{s.name}</p>
                                    <p className="text-xs text-gray-400">{s.city}</p>
                                </div>
                                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Review</span>
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-[#1A1A2E]">Recent Bookings</h3>
                    </div>
                    {bookings.slice(0, 3).map((b:any, i:number) => (
                        <div key={b.id} className={`px-5 py-3.5 flex items-center gap-3 ${i < 2 ? 'border-b border-gray-50' : ''}`}>
                            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-sm font-bold text-[#FF6B35]">
                                #{i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-[#1A1A2E] truncate">{b.userName} → {b.shopName}</p>
                                <p className="text-gray-400 text-xs">{b.serviceName}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                    b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                }`}>{b.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function UsersView({ users: initialUsers }: any) {
    const [users, setUsers] = useState(initialUsers)
    const toggleBlock = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        await supabase.from('users').update({ isBlocked: newStatus }).eq('id', id)
        setUsers((prev:any) => prev.map((u:any) => u.id === id ? { ...u, isBlocked: newStatus } : u))
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Manage Users ({users.length})</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>User</span><span>Phone</span><span>Role</span><span>Action</span>
                </div>
                {users.map((user:any, i:number) => (
                    <div key={user.id} className={`px-5 py-4 grid grid-cols-4 items-center gap-2 ${i < users.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-pink-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {user.name?.[0] || 'U'}
                            </div>
                            <span className="font-semibold text-sm text-[#1A1A2E] truncate">{user.name}</span>
                        </div>
                        <span className="text-gray-500 text-sm">{user.phone}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'provider' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                            }`}>{user.role}</span>
                        <button onClick={() => toggleBlock(user.id, user.isBlocked)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit transition-colors ${user.isBlocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                            {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

import AdminLocationPicker from '../components/AdminLocationPicker'

function ShopsView({ shops: initialShops }: any) {
    const [shops, setShops] = useState(initialShops)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Form states
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [ownerName, setOwnerName] = useState('')
    const [shopName, setShopName] = useState('')
    const [category, setCategory] = useState('mobile-repair')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('Bangalore')
    
    // Map Location states
    const [latitude, setLatitude] = useState(0)
    const [longitude, setLongitude] = useState(0)
    const [isMapOpen, setIsMapOpen] = useState(false)

    const toggleApprove = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus
        await supabase.from('shops').update({ is_approved: newStatus }).eq('id', id)
        setShops((prev:any) => prev.map((s:any) => s.id === id ? { ...s, is_approved: newStatus } : s))
    }

    const handleLocationSelect = (lat: number, lng: number, addr: string) => {
        setLatitude(lat)
        setLongitude(lng)
        if (!address) setAddress(addr)
    }

    const handleAddShop = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!latitude || !longitude) return setError('Please drop a PIN on the map for the shop location.')
        
        setLoading(true)
        setError('')
        
        // Check if a user already exists with this phone number
        let { data: user, error: fetchErr } = await supabase.from('users').select('*').eq('phone', phone).maybeSingle()
        
        if (!user) {
            // Create a new provider user (no manual ID — let DB auto-assign or use a safe unique ID)
            const newUser = {
                id: `p${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: ownerName,
                phone,
                password,
                role: 'provider'
            }
            const { data: created, error: uErr } = await supabase.from('users').insert(newUser).select().single()
            if (uErr) {
                // Show the actual database error so we can debug it
                setError(`Failed to create user: ${uErr.message}`)
                setLoading(false)
                return
            }
            user = created
        } else {
            // User already exists — just update their password for the provider login
            const { error: pErr } = await supabase.from('users').update({ name: ownerName, password, role: 'provider' }).eq('id', user.id)
            if (pErr) console.error('Failed to update existing user:', pErr)
        }
        
        const newShop = {
            id: `s${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            owner_id: user!.id,
            name: shopName,
            category: [category],
            city,
            address,
            phone,
            rating: 5.0,
            is_approved: true,
            is_open: true,
            open_time: '09:00 AM',
            close_time: '08:00 PM',
            price_range: '₹100 - ₹500',
            latitude,
            longitude,
            images: ['https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800']
        }
        
        const { data: shopCreated, error: sErr } = await supabase.from('shops').insert(newShop).select('*').single()
        if (sErr) { setError(`Failed to create shop: ${sErr.message}`); setLoading(false); return }
        
        setShops((prev:any) => [shopCreated, ...prev])
        setIsAdding(false)
        setLoading(false)
        
        // Reset form
        setPhone(''); setPassword(''); setOwnerName(''); setShopName(''); setAddress(''); setLatitude(0); setLongitude(0);
    }

    return (
        <div className="animate-fade-in relative h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-[#1A1A2E]">Manage Shops ({shops.length})</h2>
                <button onClick={() => setIsAdding(true)} className="bg-[#1A1A2E] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform">+ Add Shop Manually</button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-[#1A1A2E]">Add New Shop</h3>
                            <button onClick={() => setIsAdding(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold hover:bg-gray-200">✕</button>
                        </div>

                        {error && <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">{error}</div>}

                        <form onSubmit={handleAddShop} className="flex flex-col gap-3">
                            <input type="text" required placeholder="Owner Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            <div className="flex gap-3">
                                <input type="text" required placeholder="Owner Phone (+91...)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                                <input type="text" required placeholder="Set Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            </div>
                            <input type="text" required placeholder="Shop Name" value={shopName} onChange={e => setShopName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            <div className="flex gap-3">
                                <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm">
                                    <option value="mobile-repair">Mobile Repair</option>
                                    <option value="laptop-repair">Laptop Repair</option>
                                    <option value="electrician">Electrician</option>
                                    <option value="plumber">Plumber</option>
                                    <option value="ac-repair">AC Repair</option>
                                    <option value="appliance-repair">Appliance Repair</option>
                                </select>
                                <input type="text" required placeholder="City" value={city} onChange={e => setCity(e.target.value)} className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            </div>
                            <input type="text" required placeholder="Full Address" value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#FF6B35] font-semibold text-sm" />
                            
                            <button type="button" onClick={() => setIsMapOpen(true)} className={`w-full border rounded-xl px-4 py-3 outline-none font-semibold text-sm flex items-center justify-between transition-colors ${latitude ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-[#FF6B35]'}`}>
                                <span className="truncate">{latitude ? `📍 PIN Set (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` : '📍 Drop PIN on Map (Required)'}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${latitude ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>{latitude ? 'Change' : 'Select'}</span>
                            </button>
                            
                            <button disabled={loading || !latitude} type="submit" className="w-full bg-[#FF6B35] text-white py-3.5 rounded-xl font-black text-base mt-2 transition-transform active:scale-95 disabled:opacity-70 shadow-lg shadow-orange-500/20">
                                {loading ? 'Adding...' : 'Create Shop'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            
            <AdminLocationPicker isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} onSelect={handleLocationSelect} />

            <div className="flex flex-col gap-4">
                {shops.map((shop:any) => (
                    <div key={shop.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-center shadow-sm">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                            <img src={shop.images?.[0] || 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800'} alt={shop.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1A1A2E]">{shop.name}</p>
                            <p className="text-gray-400 text-xs truncate">{shop.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-amber-500 text-xs font-bold">★ {shop.rating}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400 text-xs">{shop.category?.map((c:any) => c.replace(/-/g, ' ')).join(', ')}</span>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full block mb-2 ${shop.is_approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {shop.is_approved ? '✓ Approved' : '⏳ Pending'}
                            </span>
                            <button onClick={() => toggleApprove(shop.id, shop.is_approved)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${shop.is_approved ? 'bg-red-50 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {shop.is_approved ? 'Revoke' : 'Approve'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function OrdersView({ bookings }: any) {
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Order Monitoring ({bookings.length})</h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <span>ID</span><span>Customer</span><span>Shop & Service</span><span>Amount</span><span>Status</span>
                </div>
                {bookings.map((b:any, i:number) => (
                    <div key={b.id} className={`px-5 py-4 grid grid-cols-5 items-center gap-2 text-sm ${i < bookings.length - 1 ? 'border-b border-gray-50' : ''}`}>
                        <span className="text-gray-400 font-mono text-xs">#{b.id}</span>
                        <span className="font-semibold text-[#1A1A2E] truncate">{b.userName}</span>
                        <div className="min-w-0">
                            <p className="text-[#1A1A2E] font-semibold truncate text-xs">{b.shopName}</p>
                            <p className="text-gray-400 text-xs truncate">{b.serviceName}</p>
                        </div>
                        <span className="font-bold text-[#FF6B35]">₹{b.servicePrice}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                b.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                    b.status === 'on-the-way' ? 'bg-purple-100 text-purple-700' :
                                        'bg-amber-100 text-amber-700'
                            }`}>{b.status}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function AnalyticsView() {
    const MONTHLY = [
        { month: 'Oct', orders: 45, revenue: 28000 }, { month: 'Nov', orders: 62, revenue: 41000 },
        { month: 'Dec', orders: 88, revenue: 62000 }, { month: 'Jan', orders: 75, revenue: 54000 },
        { month: 'Feb', orders: 112, revenue: 78000 }, { month: 'Mar', orders: 140, revenue: 98000 },
    ]
    const maxRevenue = Math.max(...MONTHLY.map(m => m.revenue))
    const CATEGORIES_REVENUE = [
        { cat: 'Mobile Repair', pct: 35, color: '#FF6B35' },
        { cat: 'Electrician', pct: 22, color: '#6366F1' },
        { cat: 'AC Repair', pct: 20, color: '#0EA5E9' },
        { cat: 'Plumber', pct: 13, color: '#059669' },
        { cat: 'Laptop Repair', pct: 10, color: '#EAB308' },
    ]
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-black text-[#1A1A2E] mb-6">Analytics</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Monthly Growth', value: '+25%', icon: '📈', color: '#059669' },
                    { label: 'Avg Order Value', value: '₹487', icon: '💳', color: '#6366F1' },
                    { label: 'Customer Satisfaction', value: '4.6 ★', icon: '⭐', color: '#EAB308' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
                        <span className="text-2xl">{s.icon}</span>
                        <p className="font-black text-xl mt-1" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-[#1A1A2E] mb-4">Monthly Revenue (₹)</h3>
                    <div className="flex items-end gap-3 h-40">
                        {MONTHLY.map(m => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full rounded-t-lg relative group cursor-pointer"
                                    style={{ height: `${(m.revenue / maxRevenue) * 100}%`, background: 'linear-gradient(to top, #FF6B35, #FFA05C)' }}>
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A1A2E] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                                        ₹{m.revenue.toLocaleString()}
                                    </div>
                                </div>
                                <span className="text-[11px] text-gray-500 font-medium">{m.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-[#1A1A2E] mb-4">Revenue by Category</h3>
                    <div className="flex flex-col gap-3">
                        {CATEGORIES_REVENUE.map(cat => (
                            <div key={cat.cat}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{cat.cat}</span>
                                    <span className="font-bold" style={{ color: cat.color }}>{cat.pct}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${cat.pct}%`, background: cat.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AdminPanel() {
    const [activeView, setActiveView] = useState<View>('dashboard')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [users, setUsers] = useState<any[]>([])
    const [shops, setShops] = useState<any[]>([])
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const { data: u } = await supabase.from('users').select('*').order('created_at', { ascending: false })
            const { data: s } = await supabase.from('shops').select('*').order('name')
            const { data: b } = await supabase.from('bookings').select('*, users(name), shops(name), services(name)')
            
            if (u) setUsers(u)
            if (s) setShops(s)
            
            if (b) setBookings(b.map((bx:any) => ({
                ...bx,
                userName: bx.users?.name || 'User',
                shopName: bx.shops?.name || 'Shop',
                serviceName: bx.services?.name || 'Service',
                servicePrice: bx.service_price
            })))
            setLoading(false)
        }
        load()
    }, [])

    if (loading) return <div className="p-10 text-gray-400">Loading Admin Portal...</div>

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <DashboardView users={users} shops={shops} bookings={bookings} />
            case 'users': return <UsersView users={users} />
            case 'shops': return <ShopsView shops={shops} />
            case 'orders': return <OrdersView bookings={bookings} />
            case 'analytics': return <AnalyticsView />
        }
    }

    return (
        <div className="min-h-screen flex bg-[#F4F6F9]">
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A2E] transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="px-6 py-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E85A24] flex items-center justify-center text-xl">⚡</div>
                        <div>
                            <p className="text-white font-black text-lg leading-none">QuickFix</p>
                            <p className="text-white/40 text-xs">Admin Panel</p>
                        </div>
                    </div>
                </div>

                <nav className="px-3 mt-4 flex flex-col gap-1">
                    {NAV.map(item => (
                        <button key={item.id} onClick={() => { setActiveView(item.id); setSidebarOpen(false) }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeView === item.id ? 'bg-[#FF6B35] text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="absolute bottom-6 left-0 right-0 px-4">
                    <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">A</div>
                        <div>
                            <p className="text-white text-xs font-bold">Admin User</p>
                            <p className="text-white/40 text-[11px]">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                        <svg width="18" height="18" fill="none" stroke="#1A1A2E" strokeWidth="2" viewBox="0 0 24 24">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
                            <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="font-black text-[#1A1A2E] text-lg capitalize">{NAV.find(n => n.id === activeView)?.label}</h1>
                        <p className="text-gray-400 text-xs">QuickFix Platform Management</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:block text-gray-400 text-xs">QuickFix v1.0</span>
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-black text-sm">A</div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    )
}
