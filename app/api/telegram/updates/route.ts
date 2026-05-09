import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_TOKEN || "8681622018:AAGro-cOuMCBTWK41Z2OZdPHaGzgCQ_ElWk";

export async function POST(req: Request) {
  try {
    const { offset } = await req.json();
    
    // Add an abort signal for safety
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    // We add timeout=5 to the API so Telegram releases the connection within 5 secs if no updates.
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=5`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
        // Just return empty on failure to prevent frontend spam
        return NextResponse.json({ ok: true, result: [] });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    // If it aborts or fails, we just tell the frontend no updates so polling continues gracefully
    return NextResponse.json({ ok: true, result: [] });
  }
}
