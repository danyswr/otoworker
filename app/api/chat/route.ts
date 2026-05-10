import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const API_KEY = "super_secret_jules_key_123";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, provider, apiKey: userApiKey, model } = body;

    // We take the last user message as the instruction for the swarm
    const lastMessage = messages.filter((m: any) => m.role === "user").slice(-1)[0]?.content;
    const instruction = typeof lastMessage === "string" ? lastMessage : JSON.stringify(lastMessage);

    if (!instruction) {
      return NextResponse.json({ error: { message: "No instruction provided." } }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/swarm_execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY
      },
      body: JSON.stringify({
        instruction,
        provider: provider || "gemini",
        api_key: userApiKey || "",
        model: model || "gemini-2.0-flash",
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: { message: data.detail || `HTTP ${response.status} Error` } }, { status: response.status });
    }

    // Return in OpenAI-compatible format for frontend consistency
    return NextResponse.json({
      choices: [
        {
          message: {
            content: data.result
          }
        }
      ]
    });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}
