import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { phone } = await request.json()
    // Mock OTP - always sends "123456" 
    console.log(`Mock OTP 123456 sent to ${phone}`)
    return NextResponse.json({ success: true, message: 'OTP sent successfully' })
}
