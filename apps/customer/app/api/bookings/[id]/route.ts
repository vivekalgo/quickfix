import { NextResponse } from 'next/server'
import { supabase } from '@/lib/data'

const mapBooking = (b: any) => ({
    ...b,
    userId: b.user_id,
    shopId: b.shop_id,
    serviceId: b.service_id,
    servicePrice: b.service_price,
    paymentMethod: b.payment_method,
    userName: b.user_name || 'Customer',
    shopName: b.shop_name || 'Shop',
    serviceName: b.service_name || 'Service'
})

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { data, error } = await supabase.from('bookings').select('*').eq('id', params.id).single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ booking: mapBooking(data) })
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const body = await request.json()
    const updateData: any = {}
    if (body.status) updateData.status = body.status

    const { data, error } = await supabase.from('bookings').update(updateData).eq('id', params.id).select().single()
    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    
    return NextResponse.json({ booking: mapBooking(data) })
}
