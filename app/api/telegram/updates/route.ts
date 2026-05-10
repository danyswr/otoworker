import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const { offset } = await req.json();
    
    const res = await fetch(`${BACKEND_URL}/telegram/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offset })
    });

    if (!res.ok) {
        return NextResponse.json({ ok: true, result: [] });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ ok: true, result: [] });
  }
}
