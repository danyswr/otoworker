import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const { chat_id, text } = await req.json();
    
    const res = await fetch(`${BACKEND_URL}/telegram/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text })
    });
    
    const data = await res.json();
    if (!res.ok) {
        return NextResponse.json({ ok: false, error: data.detail || "Error from backend" }, { status: res.status });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
