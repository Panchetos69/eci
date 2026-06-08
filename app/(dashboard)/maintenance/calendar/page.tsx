"use client";
import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: { type: string; priority: string; status: string };
}

const eventColors: Record<string, string> = {
  PREVENTIVO: "#22c55e",
  CORRECTIVO: "#f59e0b",
  EMERGENCIA: "#ef4444",
  REVISION: "#3b82f6",
};

export default function MaintenanceCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/work-orders?hasDate=1")
      .then((r) => r.json())
      .then((data) => {
        const ev: CalendarEvent[] = (data.workOrders || [])
          .filter((wo: any) => wo.scheduledAt)
          .map((wo: any) => ({
            id: wo.id,
            title: `${wo.truck?.plate} - ${woTypeLabel(wo.type)}`,
            start: new Date(wo.scheduledAt),
            end: new Date(new Date(wo.scheduledAt).getTime() + 2 * 60 * 60 * 1000),
            resource: { type: wo.type, priority: wo.priority, status: wo.status },
          }));
        setEvents(ev);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function eventStyleGetter(event: CalendarEvent) {
    const color = eventColors[event.resource.type] || "#3b82f6";
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: "white",
        borderRadius: "6px",
      },
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/maintenance" className="p-2 hover:bg-white rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendario de Mantenciones</h1>
          <p className="text-sm text-slate-500">Vista mensual de órdenes programadas</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries({ PREVENTIVO: "Preventivo", CORRECTIVO: "Correctivo", EMERGENCIA: "Emergencia", REVISION: "Revisión" }).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: eventColors[key] }} />
            {label}
          </span>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="h-96 flex items-center justify-center text-slate-400">Cargando calendario...</div>
          ) : (
            <div style={{ height: 600 }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                culture="es"
                messages={{
                  allDay: "Todo el día",
                  previous: "Anterior",
                  next: "Siguiente",
                  today: "Hoy",
                  month: "Mes",
                  week: "Semana",
                  day: "Día",
                  agenda: "Agenda",
                  date: "Fecha",
                  time: "Hora",
                  event: "Evento",
                  noEventsInRange: "Sin eventos en este período",
                }}
                eventPropGetter={eventStyleGetter}
                popup
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function woTypeLabel(type: string) {
  const m: Record<string, string> = { PREVENTIVO: "Preventivo", CORRECTIVO: "Correctivo", EMERGENCIA: "Emergencia", REVISION: "Revisión" };
  return m[type] || type;
}
