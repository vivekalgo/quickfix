import { NextResponse } from 'next/server'
import { supabase } from '@/lib/data'

const mapShop = (s: any) => ({
    ...s,
    ownerId: s.owner_id,
    isApproved: s.is_approved,
    isOpen: s.is_open,
    priceRange: s.price_range,
    totalReviews: s.total_reviews,
    openTime: s.open_time,
    closeTime: s.close_time,
    services: s.services || [],
    reviews: s.reviews || []
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'distance'

    let query = supabase.from('shops').select('*, services(*), reviews(*)')

    if (category && category !== 'all') {
        query = query.contains('category', [category])
    }

    const { data: shopsData, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let shops = (shopsData || []).map(mapShop)

    if (search) {
        const q = search.toLowerCase()
        shops = shops.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.category.some((c: string) => c.includes(q)) ||
            s.services.some((sv: any) => sv.name.toLowerCase().includes(q))
        )
    }

    // Sort
    if (sort === 'rating') {
        shops.sort((a, b) => b.rating - a.rating)
    } else if (sort === 'price') {
        shops.sort((a, b) => {
            const aMin = a.services.length > 0 ? Math.min(...a.services.map((s: any) => s.price)) : 0
            const bMin = b.services.length > 0 ? Math.min(...b.services.map((s: any) => s.price)) : 0
            return aMin - bMin
        })
    } else {
        shops.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return NextResponse.json({ shops, total: shops.length })
}
