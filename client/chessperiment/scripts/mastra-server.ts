import { createServer } from 'node:http'
import { editorAgent } from '../src/mastra/agents/editor-agent'

const PORT = parseInt(process.env.MASTRA_AGENT_PORT || '4177')

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    const buffers: Buffer[] = []
    for await (const chunk of req) {
      buffers.push(Buffer.from(chunk))
    }
    const { messages } = JSON.parse(Buffer.concat(buffers).toString()) as ChatRequest

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) {
      res.writeHead(400)
      res.end(JSON.stringify({ error: 'No user message found' }))
      return
    }

    const response = await editorAgent.generate(lastUserMsg.content)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      role: 'assistant',
      content: response.text,
    }))
  } catch (err) {
    console.error('Mastra agent error:', err)
    res.writeHead(500)
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
})

server.listen(PORT, () => {
  console.log(`Mastra agent server running on http://localhost:${PORT}`)
})
