import { NextResponse } from 'next/server'
import { supabase } from '@/lib/data'

export async function POST(request: Request) {
    const { phone, otp } = await request.json()
    if (otp !== '123456') {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
    }
    
    let { data: user } = await supabase.from('users').select('*').eq('phone', phone).single()
    
    if (!user) {
        const newUser = {
            id: `u${Date.now()}`,
            name: 'New User',
            phone,
            role: 'customer',
        }
        const { data: created, error: createError } = await supabase.from('users').insert(newUser).select().single()
        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }
        user = created
    }
    
    const returnedUser = {
        ...user,
        isBlocked: user.isBlocked,
        createdAt: user.created_at
    }

    return NextResponse.json({ success: true, user: returnedUser, token: `mock-token-${user.id}` })
}
