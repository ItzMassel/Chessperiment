import { NextRequest, NextResponse } from 'next/server'

const MASTRA_AGENT_URL = process.env.MASTRA_AGENT_URL || 'http://localhost:3002/api/ai/mastra'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 })
    }

    const response = await fetch(`${MASTRA_AGENT_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: text }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('Mastra proxy error:', err)
    return NextResponse.json({ error: 'Failed to reach Mastra agent' }, { status: 502 })
  }
}
