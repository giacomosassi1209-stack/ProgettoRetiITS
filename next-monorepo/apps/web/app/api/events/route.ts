import { NextResponse } from "next/server"

const sampleEvents = [
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
    description: "Sessione pratica per collegare l&apos;agenda a n8n.",
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

export async function GET() {
  return NextResponse.json({ events: sampleEvents })
}
