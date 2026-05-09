import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_TOKEN || "8681622018:AAGro-cOuMCBTWK41Z2OZdPHaGzgCQ_ElWk";

export async function POST(req: Request) {
  try {
    const { chat_id, text } = await req.json();
    
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text })
    });
    
    if (!res.ok) {
        throw new Error(`Telegram API responded with ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
