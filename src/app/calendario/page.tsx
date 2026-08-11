"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { formatDateBR, formatMinutesLong, todayDateOnly } from "@/domain/time";

type DayCell = {
  date: string;
  status: "done" | "partial" | "below" | "empty";
  hasClass: boolean;
  entry: {
    id: string;
    entryTime: string;
    breakStart: string;
    breakEnd: string;
    exitTime: string;
    workedMinutes: number;
    dayBalanceMinutes: number;
    notes?: string | null;
  } | null;
  aulas: Array<{ name: string; startTime: string; endTime: string }>;
  dailyGoal: number;
  holiday: { name: string; type: string } | null;
};

const statusColor: Record<DayCell["status"], string> = {
  done: "bg-emerald-500",
  partial: "bg-amber-400",
  below: "bg-rose-500",
  empty: "bg-slate-300",
};

export default function CalendarioPage() {
  const today = todayDateOnly();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [days, setDays] = useState<DayCell[]>([]);
  const [selected, setSelected] = useState<DayCell | null>(null);

  useEffect(() => {
    fetch(`/api/calendar?month=${month}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days ?? []));
  }, [month]);

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(
      `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
    );
    setSelected(null);
  }

  const firstWeekday = days[0]
    ? (() => {
        const d = new Date(days[0].date + "T00:00:00Z");
        const wd = d.getUTCDay();
        return wd === 0 ? 6 : wd - 1; // seg=0
      })()
    : 0;

  return (
    <div>
      <PageHeader
        title="Calendário"
        description="Visão mensal da jornada e aulas."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-xl border bg-white px-3 py-2 text-sm"
              onClick={() => shiftMonth(-1)}
            >
              ←
            </button>
            <button
              type="button"
              className="rounded-xl border bg-white px-3 py-2 text-sm"
              onClick={() => {
                setMonth(today.slice(0, 7));
                setSelected(null);
              }}
            >
              Mês atual
            </button>
            <button
              type="button"
              className="rounded-xl border bg-white px-3 py-2 text-sm"
              onClick={() => shiftMonth(1)}
            >
              →
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
        <Legend color="bg-emerald-500" label="Jornada cumprida" />
        <Legend color="bg-amber-400" label="Parcial" />
        <Legend color="bg-rose-500" label="Abaixo da meta" />
        <Legend color="bg-sky-500" label="Aula" />
        <Legend color="bg-slate-300" label="Sem registro" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <p className="mb-4 text-center text-lg font-semibold text-emerald-950">
            {month}
          </p>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`e-${i}`} />
            ))}
            {days.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelected(day)}
                className={`relative aspect-square rounded-xl border p-1 text-left transition hover:border-emerald-600 ${
                  selected?.date === day.date
                    ? "border-emerald-700 bg-emerald-50"
                    : "border-slate-100 bg-white"
                }`}
              >
                <span className="text-xs font-medium">{Number(day.date.slice(8))}</span>
                <span
                  className={`absolute bottom-1 left-1 h-2 w-2 rounded-full ${statusColor[day.status]}`}
                />
                {day.hasClass ? (
                  <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-sky-500" />
                ) : null}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          {!selected ? (
            <p className="text-sm text-slate-500">Selecione um dia para ver detalhes.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <h2 className="font-semibold text-emerald-950">
                {formatDateBR(selected.date)}
              </h2>
              {selected.holiday ? (
                <p className="rounded-lg bg-violet-50 px-3 py-2 text-violet-900">
                  {selected.holiday.name} ({selected.holiday.type})
                </p>
              ) : null}
              {selected.entry ? (
                <>
                  <p>
                    Batidas: {selected.entry.entryTime} · {selected.entry.breakStart} ·{" "}
                    {selected.entry.breakEnd} · {selected.entry.exitTime}
                  </p>
                  <p>
                    Trabalhado: {formatMinutesLong(selected.entry.workedMinutes)}
                  </p>
                  <p>
                    Saldo:{" "}
                    {formatMinutesLong(selected.entry.dayBalanceMinutes, true)}
                  </p>
                  {selected.entry.notes ? (
                    <p className="text-slate-600">Obs.: {selected.entry.notes}</p>
                  ) : null}
                  <a
                    href={`/ponto?id=${selected.entry.id}`}
                    className="inline-block text-emerald-800 hover:underline"
                  >
                    Editar batidas
                  </a>
                </>
              ) : (
                <p className="text-slate-500">Sem registro de ponto.</p>
              )}
              {selected.aulas.length > 0 ? (
                <div>
                  <p className="font-medium">Aulas</p>
                  <ul className="mt-1 space-y-1">
                    {selected.aulas.map((a, i) => (
                      <li key={i}>
                        {a.name}: {a.startTime} → {a.endTime}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
