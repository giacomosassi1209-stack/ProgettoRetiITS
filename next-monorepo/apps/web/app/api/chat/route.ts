import { NextResponse } from "next/server"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type ChatPayload = {
  message?: string
  history?: ChatMessage[]
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function extractReply(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload
  }

  if (!payload || typeof payload !== "object") {
    return null
  }

  const candidate = payload as Record<string, unknown>
  const directKeys = ["reply", "message", "output", "text", "response", "answer"]

  for (const key of directKeys) {
    if (typeof candidate[key] === "string") {
      return candidate[key] as string
    }
  }

  if (candidate.data && typeof candidate.data === "object") {
    const nested = candidate.data as Record<string, unknown>
    for (const key of directKeys) {
      if (typeof nested[key] === "string") {
        return nested[key] as string
      }
    }
  }

  return null
}

export async function POST(request: Request) {
  let payload: ChatPayload

  try {
    payload = await request.json()
  } catch {
    return badRequest("Richiesta JSON non valida")
  }

  const message = payload.message?.trim()

  if (!message) {
    return badRequest("Il campo 'message' e' obbligatorio")
  }

  const webhookUrl = process.env.N8N_CHAT_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json({
      reply: `Modalita' demo: imposta N8N_CHAT_WEBHOOK_URL per collegare la chat al tuo flusso n8n. Hai scritto: "${message}"`,
      source: "demo",
    })
  }

  try {
    const upstreamResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history: Array.isArray(payload.history) ? payload.history : [],
      }),
    })

    if (!upstreamResponse.ok) {
      const details = await upstreamResponse.text()
      return NextResponse.json(
        {
          error: "Webhook n8n non disponibile",
          details,
        },
        { status: 502 }
      )
    }

    const contentType = upstreamResponse.headers.get("content-type") ?? ""
    const upstreamPayload = contentType.includes("application/json")
      ? await upstreamResponse.json()
      : await upstreamResponse.text()
    const reply = extractReply(upstreamPayload)

    if (!reply) {
      return NextResponse.json(
        {
          error: "Il webhook n8n ha risposto ma senza un testo riconoscibile",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ reply, source: "n8n" })
  } catch {
    return NextResponse.json(
      {
        error: "Errore di connessione verso il webhook n8n",
      },
      { status: 502 }
    )
  }
}