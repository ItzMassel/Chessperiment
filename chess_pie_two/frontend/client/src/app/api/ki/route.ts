import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Lese den Body der eingehenden Request aus
    const body = await req.json();

    // Sende die Request weiter an Deepseek (OpenAI-kompatible API)
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Achtung: In einer produktiven App sollte der Key idealerweise in einer .env Datei liegen (z.B. process.env.DEEPSEEK_API_KEY)
        'Authorization': `Bearer sk-7761f10a1177490db05b157d19ee92b1`
      },
      body: JSON.stringify(body)
    });

    // Hole die Antwort von Deepseek
    const data = await response.json();

    // Gib die Antwort mit dem entsprechenden Statuscode an den Client zurück
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error forwarding to Deepseek:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
