import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AQ.Ab8RN6Ld69EHuF_8oM1zqQUxcBJ_XxW1xi5gJMorLkU8QCULiQ";
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function POST(req: Request) {
  try {
    const { task, agentName } = await req.json();

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
           role: 'user',
           parts: [{ text: `You are an AI virtual worker named ${agentName || 'Worker'} inside a simulated top-down 2D office game. A user has given you the following task to work on: "${task}". Please respond in character. Be extremely concise (max 2 sentences). Do not break character. Do not provide code blocks. Example: 'I'll get right on that boss! Processing the spreadsheet now.'` }]
        }
      ]
    });

    const responseText = response.text || "Internal failure in my logical unit...";
    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ result: `Oops, something went wrong in my cognitive circuit... (${error.message})` });
  }
}
