import { NextResponse } from 'next/server';
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-7761f10a1177490db05b157d19ee92b1', // process.env.DEEPSEEK_API_KEY
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const completion = await openai.chat.completions.create({
      model: "deepseek-v4-flash",
      // @ts-ignore - Deepseek spezifische Parameter
      thinking: {"type": "enabled"},
      // @ts-ignore
      reasoning_effort: "high",
      stream: false,
      // Überschreibe/Ergänze obige Werte mit denen aus der Client-Request (z.B. messages)
      ...body
    });

    return NextResponse.json(completion);
  } catch (error) {
    console.error('Error forwarding to Deepseek via OpenAI SDK:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
