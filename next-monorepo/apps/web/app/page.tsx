"use client"

import * as React from "react"
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

  function goToPreviousMonth() {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setCurrentMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))
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
                <p className="text-sm font-semibold uppercase tracking-[0.36em] text-sky-400">Calendario</p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
                  I tuoi impegni, chiari e veloci
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  Una vista scura ma più nitida, con elementi glassmorphism leggeri e contrasto più bilanciato.
                </p>
              </div>
              <div className="rounded-[2rem] bg-white/15 p-5 ring-1 ring-white/20 shadow-sm sm:p-6 backdrop-blur-2xl">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-200">Connessione n8n</p>
                <p className="mt-4 text-sm leading-6 text-slate-100">
                  Quando sarai pronto, sostituisci il backend dell&apos;endpoint <code className="rounded-xl bg-slate-950/90 px-2 py-0.5 text-xs text-slate-200">/api/events</code> con la tua logica n8n.
                </p>
                <Button onClick={() => window.location.reload()} className="mt-6 w-full rounded-3xl bg-sky-500/95 text-white transition hover:bg-sky-400/95" size="lg">
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
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth} className="rounded-3xl border-white/15 bg-slate-950/60 text-white hover:bg-slate-950/80">
                      ←
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth} className="rounded-3xl border-white/15 bg-slate-950/60 text-white hover:bg-slate-950/80">
                      →
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
                        className={`group flex h-24 flex-col justify-between rounded-3xl border p-3 text-left transition-all duration-200 ${
                          day.isCurrentMonth ? "bg-white/20 text-white shadow-slate-950/20" : "bg-slate-950/65 text-slate-300"
                        } ${isSelected ? "border-sky-400/60 bg-sky-500/25 shadow-lg shadow-sky-500/15" : "border-transparent"} ${day.isToday ? "ring-1 ring-sky-300/40" : ""}`}
                      >
                        <span className={`text-sm font-semibold ${day.isCurrentMonth ? "text-white" : "text-slate-300"}`}>
                          {day.label}
                        </span>
                        <span className="mt-2 text-xs text-slate-200">
                          {dayEvents.length ? `${dayEvents.length} impegno${dayEvents.length > 1 ? "i" : ""}` : "–"}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

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
                      <article key={event.id} className="rounded-3xl border border-white/15 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/15">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-base font-semibold text-white">{event.title}</h4>
                          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs text-sky-200">{event.time}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-200">{event.description}</p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/75 p-6 text-sm text-slate-300">
                      Nessun impegno per questa data. Carica il calendario e prova un altro giorno.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
