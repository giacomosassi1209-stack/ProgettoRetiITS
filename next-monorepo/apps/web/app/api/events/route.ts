import { NextResponse } from "next/server"

type EventItem = {
  id: string
  title: string
  date: string
  time: string
  description: string
}

const sampleEvents: EventItem[] = [
  {
    id: "1",
    title: "Riunione progetto",
    date: "2026-05-14",
    time: "10:00",
    description: "Incontro con il team per definire priorità e scadenze.",
  },
  {
    id: "2",
    title: "Revisione documenti",
    date: "2026-05-14",
    time: "14:30",
    description: "Controllo finale dei documenti per il cliente.",
  },
  {
    id: "3",
    title: "Workshop n8n",
    date: "2026-05-18",
    time: "11:00",
    description: "Sessione pratica per collegare l'agenda a n8n.",
  },
  {
    id: "4",
    title: "Pianificazione giornaliera",
    date: "2026-05-20",
    time: "09:00",
    description: "Organizza gli impegni della settimana successiva.",
  },
  {
    id: "5",
    title: "Feedback cliente",
    date: "2026-05-23",
    time: "16:00",
    description: "Call per ricevere il feedback sul nuovo sito.",
  },
]

let currentEvents: EventItem[] = sampleEvents

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const date = url.searchParams.get("date")
  const events = date ? currentEvents.filter((item) => item.date === date) : currentEvents
  return NextResponse.json({ events })
}

export async function POST(request: Request) {
  let payload: { events?: EventItem[] }

  try {
    payload = await request.json()
  } catch {
    return badRequest("Richiesta JSON non valida")
  }

  if (!payload?.events || !Array.isArray(payload.events)) {
    return badRequest("Invia un body JSON con { events: [...] }")
  }

  currentEvents = payload.events
  return NextResponse.json({ status: "ok", total: currentEvents.length })
}
