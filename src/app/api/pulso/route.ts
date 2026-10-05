import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { obtenerPulso } from '@/lib/pulso'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await obtenerPulso(createClient()), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
