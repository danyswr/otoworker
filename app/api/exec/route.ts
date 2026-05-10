import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const API_KEY = "super_secret_jules_key_123";

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    
    if (!command) {
      return NextResponse.json({ ok: false, error: "No command provided" }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY
      },
      body: JSON.stringify({ command })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ ok: false, ...data }, { status: response.status });
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
