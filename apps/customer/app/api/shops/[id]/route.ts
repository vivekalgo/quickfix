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

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { data: shop, error } = await supabase
        .from('shops')
        .select('*, services(*), reviews(*)')
        .eq('id', params.id)
        .single()

    if (error || !shop) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }
    
    return NextResponse.json({ shop: mapShop(shop) })
}
