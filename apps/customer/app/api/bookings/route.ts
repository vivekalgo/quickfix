import { NextResponse } from 'next/server'
import { supabase } from '@/lib/data'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const shopId = searchParams.get('shopId')

    let query = supabase.from('bookings').select('*')
    if (userId) query = query.eq('user_id', userId)
    if (shopId) query = query.eq('shop_id', shopId)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const bookings = (data || []).map((b: any) => ({
        ...b,
        userId: b.user_id,
        shopId: b.shop_id,
        serviceId: b.service_id,
        servicePrice: b.service_price,
        paymentMethod: b.payment_method,
        userName: b.user_name || 'Customer', // mock fallback
        shopName: b.shop_name || 'Shop',
        serviceName: b.service_name || 'Service'
    }))

    return NextResponse.json({ bookings })
}

export async function POST(request: Request) {
    const body = await request.json()
    const newBooking = {
        id: `b${Date.now()}`,
        user_id: body.userId,
        shop_id: body.shopId,
        service_id: body.serviceId,
        date: body.date,
        time: body.time,
        address: body.address,
        description: body.description,
        service_price: body.servicePrice,
        payment_method: body.paymentMethod || 'cash',
        status: 'requested',
    }
    
    const { error } = await supabase.from('bookings').insert(newBooking)
    if (error) {
         return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const returnedBooking = {
        ...body,
        id: newBooking.id,
        status: newBooking.status,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
    return NextResponse.json({ booking: returnedBooking }, { status: 201 })
}
