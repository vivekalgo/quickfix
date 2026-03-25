import { NextResponse } from 'next/server'
import { CATEGORIES } from '@/lib/data'

export async function GET() {
    return NextResponse.json({ categories: CATEGORIES })
}
