"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  PageHeader,
  ProgressBar,
  Skeleton,
  Tooltip,
} from "@/components/ui";
import {
  PageTransition,
  Reveal,
  ContentFade,
} from "@/components/motion";
import { useCountUp } from "@/hooks/use-count-up";
import {
  formatDateBR,
  formatMinutesLong,
  todayDateOnly,
  WEEKDAY_NAMES,
  getIsoWeekday,
} from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  LogIn,
  LogOut,
  Plus,
  X,
  BookOpen,
} from "lucide-react";

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

type LegendFilter =
  | "done"
  | "partial"
  | "below"
  | "empty"
  | "class"
  | "holiday"
  | null;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function shiftMonthValue(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function statusLabel(day: DayCell) {
  if (day.holiday) return "Feriado";
  switch (day.status) {
    case "done":
      return "Completo";
    case "partial":
      return "Parcial";
    case "below":
      return "Abaixo";
    default:
      return "Sem registro";
  }
}

function statusBadgeColor(
  day: DayCell
): "emerald" | "amber" | "rose" | "slate" | "violet" {
  if (day.holiday) return "violet";
  if (day.status === "done") return "emerald";
  if (day.status === "partial") return "amber";
  if (day.status === "below") return "rose";
  return "slate";
}

function matchesFilter(day: DayCell, filter: LegendFilter) {
  if (!filter) return true;
  if (filter === "class") return day.hasClass;
  if (filter === "holiday") return Boolean(day.holiday);
  return day.status === filter;
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in" aria-busy>
      <Skeleton shape="line" className="mx-auto h-7 w-48" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`h-${i}`} shape="line" className="h-4" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton
            key={i}
            shape="rect"
            className="aspect-square h-auto min-h-[72px]"
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="relative flex items-start gap-3">
      <span className="absolute -left-4 mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[color:var(--surface)] text-[color:var(--brand)] ring-2 ring-[color:var(--brand-soft)]">
        <Icon className="h-2.5 w-2.5" />
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
          {label}
        </p>
        <p className="font-medium tabular-nums text-[color:var(--text)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function DayDetailPanel({
  day,
  onClose,
  mobile,
}: {
  day: DayCell;
  onClose: () => void;
  mobile: boolean;
}) {
  const pct = day.entry
    ? Math.min(
        100,
        Math.round(
          (day.entry.workedMinutes / Math.max(1, day.dailyGoal)) * 100
        )
      )
    : 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        mobile ? "animate-slide-up" : "animate-slide-in-right"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
            {WEEKDAY_NAMES[getIsoWeekday(day.date)]}
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[color:var(--text)]">
            {formatDateBR(day.date)}
          </h2>
          <div className="mt-2">
            <Badge color={statusBadgeColor(day)}>{statusLabel(day)}</Badge>
            {day.hasClass ? (
              <Badge color="sky" className="ml-1.5">
                Aula
              </Badge>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="!px-2 !py-2"
          onClick={onClose}
          aria-label="Fechar detalhe"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto text-sm">
        {day.holiday ? (
          <div className="rounded-xl border border-violet-200/60 bg-violet-50 px-3 py-2 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
            <p className="font-medium">{day.holiday.name}</p>
            <p className="text-xs opacity-80">{day.holiday.type}</p>
          </div>
        ) : null}

        {day.entry ? (
          <>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                Timeline
              </p>
              <div className="relative space-y-3 pl-4 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-[color:var(--border)]">
                <TimelineItem
                  icon={LogIn}
                  label="Entrada"
                  value={day.entry.entryTime}
                />
                <TimelineItem
                  icon={Coffee}
                  label="Intervalo"
                  value={`${day.entry.breakStart} → ${day.entry.breakEnd}`}
                />
                <TimelineItem
                  icon={LogOut}
                  label="Saída"
                  value={day.entry.exitTime}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[color:var(--text-secondary)]">
                  Trabalhado
                </span>
                <span className="font-semibold tabular-nums">
                  {formatMinutesLong(day.entry.workedMinutes)}
                </span>
              </div>
              <ProgressBar value={pct} showLabel />
              <p
                className={cn(
                  "text-sm font-medium tabular-nums",
                  day.entry.dayBalanceMinutes >= 0
                    ? "text-[color:var(--status-success)]"
                    : "text-[color:var(--status-danger)]"
                )}
              >
                Saldo: {formatMinutesLong(day.entry.dayBalanceMinutes, true)}
              </p>
              {day.entry.notes ? (
                <p className="text-[color:var(--text-muted)]">
                  Obs.: {day.entry.notes}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-[color:var(--border)] px-4 py-6 text-center text-[color:var(--text-muted)]">
            Sem registro de ponto neste dia.
          </p>
        )}

        {day.aulas.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
              <BookOpen className="h-3.5 w-3.5" />
              Aulas
            </p>
            <div className="space-y-2">
              {day.aulas.map((a, i) => (
                <div
                  key={`${a.name}-${i}`}
                  className="rounded-xl border border-sky-200/70 bg-sky-50 px-3 py-2 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
                >
                  <p className="font-medium">{a.name}</p>
                  <p className="text-xs opacity-80">
                    {a.startTime} → {a.endTime}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-[color:var(--border)] pt-4">
        {day.entry ? (
          <Link href={`/ponto?id=${day.entry.id}`}>
            <Button type="button" className="w-full">
              Editar ponto
            </Button>
          </Link>
        ) : (
          <Link href="/ponto">
            <Button type="button" className="w-full">
              <Plus className="h-4 w-4" />
              Registrar ponto
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums text-[color:var(--text)]",
          tone
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default function CalendarioPage() {
  const today = todayDateOnly();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [days, setDays] = useState<DayCell[]>([]);
  const [dailyGoal, setDailyGoal] = useState(480);
  const [selected, setSelected] = useState<DayCell | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LegendFilter>(null);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setDays(d.days ?? []);
        setDailyGoal(d.dailyGoal ?? 480);
      })
      .finally(() => setLoading(false));
  }, [month]);

  function shiftMonth(delta: number) {
    setSlideDir(delta > 0 ? "left" : "right");
    setAnimKey((k) => k + 1);
    setMonth((prev) => shiftMonthValue(prev, delta));
    setSelected(null);
  }

  const firstWeekday = days[0]
    ? (() => {
        const d = new Date(days[0].date + "T00:00:00Z");
        const wd = d.getUTCDay();
        return wd === 0 ? 6 : wd - 1;
      })()
    : 0;

  const monthSummary = useMemo(() => {
    const withEntry = days.filter((d) => d.entry);
    const totalWorked = withEntry.reduce(
      (s, d) => s + (d.entry?.workedMinutes ?? 0),
      0
    );
    const workdays = days.filter((d) => {
      const wd = getIsoWeekday(d.date);
      return wd >= 1 && wd <= 5 && !d.holiday;
    });
    const fulfilled = workdays.filter((d) => d.status === "done").length;
    const avg =
      withEntry.length > 0 ? Math.round(totalWorked / withEntry.length) : 0;
    const expected = workdays.length * dailyGoal;
    const balance = totalWorked - expected;
    return {
      totalWorked,
      fulfilled,
      workdayCount: workdays.length,
      avg,
      balance,
    };
  }, [days, dailyGoal]);

  const totalWorkedAnim = useCountUp(monthSummary.totalWorked);
  const avgAnim = useCountUp(monthSummary.avg);
  const balanceAnim = useCountUp(monthSummary.balance);
  const fulfilledAnim = useCountUp(monthSummary.fulfilled);

  const legendItems: Array<{
    key: LegendFilter;
    label: string;
    color: "emerald" | "amber" | "rose" | "sky" | "slate" | "violet";
  }> = [
    { key: "done", label: "Cumprida", color: "emerald" },
    { key: "partial", label: "Parcial", color: "amber" },
    { key: "below", label: "Abaixo", color: "rose" },
    { key: "class", label: "Aula", color: "sky" },
    { key: "empty", label: "Sem registro", color: "slate" },
    { key: "holiday", label: "Feriado", color: "violet" },
  ];

  const prevMonth = monthLabel(shiftMonthValue(month, -1));
  const nextMonth = monthLabel(shiftMonthValue(month, 1));

  return (
    <PageTransition>
      <PageHeader
        title="Calendário"
        description="Visão mensal da jornada e aulas."
        action={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="!px-3"
              onClick={() => shiftMonth(-1)}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSlideDir(null);
                setAnimKey((k) => k + 1);
                setMonth(today.slice(0, 7));
                setSelected(null);
              }}
            >
              Mês atual
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!px-3"
              onClick={() => shiftMonth(1)}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <Reveal className="mb-4 flex flex-wrap gap-2">
        {legendItems.map((item) => (
          <button
            key={String(item.key)}
            type="button"
            onClick={() =>
              setFilter((prev) => (prev === item.key ? null : item.key))
            }
            className={cn(
              "rounded-full transition-transform",
              filter === item.key &&
                "scale-105 ring-2 ring-[color:var(--brand)] ring-offset-2 ring-offset-[color:var(--background)]"
            )}
          >
            <Badge color={item.color}>{item.label}</Badge>
          </button>
        ))}
        {filter ? (
          <button
            type="button"
            onClick={() => setFilter(null)}
            className="text-xs text-[color:var(--text-muted)] underline-offset-2 hover:underline"
          >
            Limpar filtro
          </button>
        ) : null}
      </Reveal>

      <div className="relative grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        <div
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current == null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 60) shiftMonth(delta < 0 ? 1 : -1);
            touchStartX.current = null;
          }}
        >
          <Card className="relative overflow-hidden">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
              <span className="truncate opacity-60">← {prevMonth}</span>
              <span className="truncate opacity-60">{nextMonth} →</span>
            </div>

            <p className="mb-4 text-center font-[family-name:var(--font-display)] text-2xl text-[color:var(--brand)]">
              {monthLabel(month)}
            </p>

            {loading ? (
              <CalendarSkeleton />
            ) : (
              <ContentFade>
              <div
                key={animKey}
                className={cn(
                  slideDir === "left" && "animate-slide-in-right",
                  slideDir === "right" && "animate-slide-down",
                  !slideDir && "animate-fade-in"
                )}
              >
                <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-[color:var(--text-muted)] sm:gap-2 sm:text-xs">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                    (d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({ length: firstWeekday }).map((_, i) => (
                    <div key={`e-${i}`} />
                  ))}
                  {days.map((day, index) => {
                    const highlighted = matchesFilter(day, filter);
                    const dimmed = filter != null && !highlighted;
                    const isToday = day.date === today;
                    const selectedDay = selected?.date === day.date;
                    const pct = day.entry
                      ? Math.min(
                          100,
                          Math.round(
                            (day.entry.workedMinutes /
                              Math.max(1, day.dailyGoal)) *
                              100
                          )
                        )
                      : 0;

                    const tip = day.entry
                      ? `Trabalhado: ${formatMinutesLong(day.entry.workedMinutes)} / Meta: ${formatMinutesLong(day.dailyGoal)}`
                      : day.holiday
                        ? day.holiday.name
                        : "Sem registro";

                    return (
                      <Tooltip key={day.date} content={tip} delay={180}>
                        <button
                          type="button"
                          onClick={() => setSelected(day)}
                          style={{ animationDelay: `${index * 12}ms` }}
                          className={cn(
                            "group relative flex min-h-[72px] flex-col rounded-xl border p-1.5 text-left transition-all duration-200 animate-fade-in sm:min-h-[88px] sm:p-2",
                            "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
                            selectedDay
                              ? "border-[color:var(--brand)] bg-[color:var(--brand-soft)]"
                              : "border-[color:var(--border)] bg-[color:var(--surface)]",
                            isToday &&
                              "ring-2 ring-[color:var(--brand)]/40 animate-pulse-soft",
                            dimmed && "opacity-25"
                          )}
                        >
                          <span className="text-sm font-semibold tabular-nums text-[color:var(--text)] sm:text-base">
                            {Number(day.date.slice(8))}
                          </span>

                          <div className="mt-auto space-y-1">
                            {day.entry ? (
                              <div className="h-1 overflow-hidden rounded-full bg-[color:var(--border)]">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    day.status === "done" &&
                                      "bg-[color:var(--status-success)]",
                                    day.status === "partial" &&
                                      "bg-[color:var(--status-warning)]",
                                    day.status === "below" &&
                                      "bg-[color:var(--status-danger)]"
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            ) : (
                              <div className="h-1 rounded-full bg-transparent" />
                            )}

                            <div className="flex flex-wrap gap-0.5">
                              {day.hasClass ? (
                                <span className="rounded bg-sky-500/15 px-1 text-[8px] font-medium text-sky-700 dark:text-sky-300">
                                  aula
                                </span>
                              ) : null}
                              {day.holiday ? (
                                <span className="rounded bg-violet-500/15 px-1 text-[8px] font-medium text-violet-700 dark:text-violet-300">
                                  feriado
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
              </ContentFade>
            )}
          </Card>
        </div>

        <Card className="hidden min-h-[420px] lg:block">
          {!selected ? (
            <p className="text-sm text-[color:var(--text-muted)]">
              Selecione um dia para ver detalhes.
            </p>
          ) : (
            <DayDetailPanel
              day={selected}
              onClose={() => setSelected(null)}
              mobile={false}
            />
          )}
        </Card>
      </div>

      <Reveal>
        <Card variant="glass" className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-[color:var(--text)]">
            Resumo de {monthLabel(month)}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric
              label="Total trabalhado"
              value={formatMinutesLong(totalWorkedAnim)}
            />
            <SummaryMetric
              label="Dias úteis cumpridos"
              value={`${fulfilledAnim}/${monthSummary.workdayCount}`}
            />
            <SummaryMetric
              label="Média diária"
              value={formatMinutesLong(avgAnim)}
            />
            <SummaryMetric
              label="Saldo mensal"
              value={formatMinutesLong(balanceAnim, true)}
              tone={
                monthSummary.balance >= 0
                  ? "text-[color:var(--status-success)]"
                  : "text-[color:var(--status-danger)]"
              }
            />
          </div>
        </Card>
      </Reveal>

      {selected ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 bg-[color:var(--overlay)] animate-fade-in"
            onClick={() => setSelected(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-[var(--shadow-lg)]">
            <div className="mb-3 flex justify-center">
              <span className="h-1.5 w-12 rounded-full bg-[color:var(--border-strong)]" />
            </div>
            <DayDetailPanel
              day={selected}
              onClose={() => setSelected(null)}
              mobile
            />
          </div>
        </div>
      ) : null}
    </PageTransition>
  );
}
