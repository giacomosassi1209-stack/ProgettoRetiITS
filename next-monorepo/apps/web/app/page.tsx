"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarDays, MessageCircle, RefreshCw, SendHorizonal } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

type EventItem = {
  id: string
  title: string
  date: string
  time: string
  description: string
}

type CalendarDay = {
  iso: string
  label: number
  isCurrentMonth: boolean
  isToday: boolean
}

type ChatRole = "user" | "assistant"

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

function getMonthLabel(date: Date) {
  return date.toLocaleString("it-IT", { month: "long", year: "numeric" })
}

function getCalendarDays(month: Date): CalendarDay[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)

  const startDay = new Date(firstDay)
  const dayOffset = (firstDay.getDay() + 6) % 7
  startDay.setDate(firstDay.getDate() - dayOffset)

  const calendar: CalendarDay[] = []
  const totalDays = 42

  for (let index = 0; index < totalDays; index += 1) {
    const current = new Date(startDay)
    current.setDate(startDay.getDate() + index)
    const iso = current.toISOString().slice(0, 10)

    calendar.push({
      iso,
      label: current.getDate(),
      isCurrentMonth: current.getMonth() === month.getMonth(),
      isToday: iso === new Date().toISOString().slice(0, 10),
    })
  }

  return calendar
}

export default function Page() {
  const [events, setEvents] = React.useState<EventItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content: "Ciao, sono il tuo assistente. Scrivimi e rispondo tramite il webhook n8n collegato al tuo LLM.",
    },
  ])
  const [chatInput, setChatInput] = React.useState("")
  const [chatLoading, setChatLoading] = React.useState(false)
  const [chatError, setChatError] = React.useState<string | null>(null)
  const chatEndRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    async function loadEvents() {
      setLoading(true)
      try {
        const response = await fetch("/api/events")
        const data = await response.json()
        setEvents(data.events ?? [])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const calendarDays = React.useMemo(() => getCalendarDays(currentMonth), [currentMonth])

  const eventsByDate = React.useMemo(() => {
    return events.reduce<Record<string, EventItem[]>>((group, event) => {
      group[event.date] = [...(group[event.date] ?? []), event]
      return group
    }, {})
  }, [events])

  const selectedEvents = eventsByDate[selectedDate] ?? []

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [chatMessages, chatLoading])

  function goToPreviousMonth() {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
  }

  function goToToday() {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(today.toISOString().slice(0, 10))
  }

  async function onSubmitChat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = chatInput.trim()

    if (!message || chatLoading) {
      return
    }

    const nextUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    }

    const history = chatMessages.map((item) => ({
      role: item.role,
      content: item.content,
    }))

    setChatMessages((previous) => [...previous, nextUserMessage])
    setChatInput("")
    setChatError(null)
    setChatLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, history }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error ?? "Errore durante la chiamata chat")
      }

      setChatMessages((previous) => [
        ...previous,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: typeof data.reply === "string" ? data.reply : "Risposta non disponibile.",
        },
      ])
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : "Errore sconosciuto"
      setChatError(fallbackMessage)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-slate-900 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-r from-slate-800/30 via-slate-700/20 to-slate-900/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="sticky top-6 z-20 flex justify-center">
            <div className="h-1.5 w-24 rounded-full bg-white/15 shadow-sm shadow-slate-950/70 backdrop-blur-xl" />
          </div>
          <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.4)] backdrop-blur-xl md:p-8">
            <div className="mb-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-sky-400" />
                  <p className="text-sm font-semibold uppercase tracking-[0.36em] text-sky-400">Calendario</p>
                </div>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
                  I tuoi impegni,{" "}<span className="text-sky-400">chiari</span> e veloci
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Visualizza e gestisci le tue attività giorno per giorno. Collega n8n per sincronizzare l&apos;agenda in tempo reale.
                </p>
              </div>
              <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/15 shadow-sm sm:p-6 backdrop-blur-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Connessione n8n</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Sostituisci il backend di{" "}<code className="rounded-lg bg-slate-950/80 px-1.5 py-0.5 text-xs font-mono text-sky-300">/api/events</code>{" "}con la tua logica n8n.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Per la chat LLM usa l&apos;endpoint{" "}<code className="rounded-lg bg-slate-950/80 px-1.5 py-0.5 text-xs font-mono text-sky-300">/api/chat</code>{" "}e collega il webhook dedicato.
                </p>
                <Button onClick={() => window.location.reload()} className="mt-5 w-full rounded-2xl bg-sky-500 text-white transition-all hover:bg-sky-400 active:scale-[0.97]" size="lg">
                  <RefreshCw className="mr-2 size-4" />
                  Aggiorna impegni
                </Button>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-[2rem] border border-white/15 bg-white/15 p-5 shadow-sm backdrop-blur-2xl md:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-200">Mese</p>
                    <h2 className="text-2xl font-semibold text-white">{getMonthLabel(currentMonth)}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon-sm" onClick={goToPreviousMonth} className="rounded-xl border-white/15 bg-slate-950/60 text-white hover:bg-slate-800/80 hover:text-white">
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToToday} className="rounded-xl px-3 text-xs font-medium text-sky-300 hover:bg-sky-500/15 hover:text-sky-200">
                      Oggi
                    </Button>
                    <Button variant="outline" size="icon-sm" onClick={goToNextMonth} className="rounded-xl border-white/15 bg-slate-950/60 text-white hover:bg-slate-800/80 hover:text-white">
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.24em] text-slate-300">
                  {weekDays.map((label) => (
                    <div key={label} className="py-2 text-slate-200">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
                  {calendarDays.map((day) => {
                    const dayEvents = eventsByDate[day.iso] ?? []
                    const isSelected = selectedDate === day.iso
                    return (
                      <button
                        key={day.iso}
                        type="button"
                        onClick={() => setSelectedDate(day.iso)}
                        className={`group relative flex h-16 flex-col justify-between rounded-2xl border p-2.5 text-left transition-all duration-150 ${
                          day.isCurrentMonth ? "bg-white/10 text-white" : "bg-slate-950/50 text-slate-500"
                        } ${isSelected ? "border-sky-400/70 bg-sky-500/20 shadow-md shadow-sky-500/20" : "border-transparent hover:border-white/15 hover:bg-white/15"} ${day.isToday ? "ring-1 ring-sky-400/50" : ""}`}
                      >
                        <span className={`text-sm font-semibold leading-none ${
                          day.isToday ? "text-sky-300" : day.isCurrentMonth ? "text-white" : "text-slate-500"
                        }`}>
                          {day.label}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex items-center gap-0.5">
                            {dayEvents.slice(0, 3).map((_, i) => (
                              <span key={i} className={`size-1.5 rounded-full ${
                                isSelected ? "bg-sky-300" : "bg-sky-400/80"
                              }`} />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[9px] leading-none text-sky-400/80">+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[2rem] border border-white/15 bg-white/15 p-5 shadow-sm backdrop-blur-2xl md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-200">Impegni</p>
                      <h3 className="text-xl font-semibold text-white">{new Date(selectedDate).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</h3>
                    </div>
                    <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs text-slate-200">
                      {selectedEvents.length} {selectedEvents.length === 1 ? "evento" : "eventi"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {loading ? (
                      <div className="rounded-3xl border border-white/15 bg-slate-950/80 p-6 text-center text-sm text-slate-200">Caricamento impegni…</div>
                    ) : selectedEvents.length ? (
                      selectedEvents.map((event) => (
                        <article key={event.id} className="group rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-sm transition-all hover:border-sky-500/30 hover:bg-slate-950/80">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="mt-0.5 size-2 shrink-0 rounded-full bg-sky-400" />
                              <h4 className="text-sm font-semibold text-white">{event.title}</h4>
                            </div>
                            <span className="shrink-0 rounded-lg bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300">{event.time}</span>
                          </div>
                          <p className="mt-2.5 pl-[18px] text-sm leading-6 text-slate-300">{event.description}</p>
                        </article>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/50 py-10 text-center">
                        <CalendarDays className="size-8 text-slate-500" />
                        <p className="text-sm text-slate-400">Nessun impegno per questa data.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/15 bg-white/15 p-5 shadow-sm backdrop-blur-2xl md:p-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="size-4 text-sky-300" />
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-200">Chat Assistant</p>
                        <p className="text-xs text-slate-400">LLM via webhook n8n</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-72 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                          message.role === "user"
                            ? "ml-auto bg-sky-500/20 text-sky-100"
                            : "bg-slate-800/90 text-slate-200"
                        }`}
                      >
                        {message.content}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="max-w-[92%] rounded-2xl bg-slate-800/90 px-3 py-2 text-sm text-slate-300">
                        Sto pensando...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {chatError && <p className="mt-3 text-xs text-rose-300">{chatError}</p>}

                  <form onSubmit={onSubmitChat} className="mt-4 flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Scrivi una richiesta per l'assistente..."
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400/60 focus:outline-none"
                    />
                    <Button type="submit" disabled={chatLoading || chatInput.trim().length === 0} className="h-11 rounded-xl bg-sky-500 px-4 text-white hover:bg-sky-400 disabled:bg-sky-900/40">
                      <SendHorizonal className="size-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
