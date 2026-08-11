"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertBanner,
  Badge,
  Button,
  Card,
  PageHeader,
  ProgressBar,
  Skeleton,
} from "@/components/ui";
import {
  PageTransition,
  Reveal,
  RevealStagger,
  ContentFade,
} from "@/components/motion";
import { useCountUp } from "@/hooks/use-count-up";
import {
  formatDateBR,
  formatMinutesLong,
  getWeekStart,
  parseHHMM,
  todayDateOnly,
} from "@/domain/time";
import { calcularResumoSemana } from "@/domain/journey";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";

type PlanningResponse = {
  planning: {
    weekStart: string;
    trabalhadoMinutos: number;
    restanteMinutos: number;
    saldoMinutos: number;
    bancoAnterior: number;
    bancoProjetado: number;
    sugestoes: Array<{
      data: string;
      weekdayName: string;
      blocos: Array<{ inicio: string; fim: string }>;
      minutos: number;
      deltaVsPadrao: number;
      aulas: Array<{ name: string; startTime: string; endTime: string }>;
    }>;
    previsaoFechamentoMinutos: number;
    viavel: boolean;
    alerta?: string;
    metaMinutos: number;
  };
  bank: {
    saldoAnterior: number;
    saldoSemana: number;
    saldoAtual: number;
  };
};

type DayResumo = ReturnType<typeof calcularResumoSemana>["porDia"][number];

function dayStatusColor(day: DayResumo, today: string) {
  if (!day.registered) {
    return day.date >= today ? "bg-[color:var(--border-strong)]" : "bg-[color:var(--status-danger)]";
  }
  if (day.balanceMinutes >= 0) return "bg-[color:var(--status-success)]";
  if (day.workedMinutes >= day.dailyGoalMinutes * 0.5) {
    return "bg-[color:var(--status-warning)]";
  }
  return "bg-[color:var(--status-danger)]";
}

function WorkBar({
  punches,
}: {
  punches: NonNullable<DayResumo["punches"]>;
}) {
  try {
    const start = parseHHMM(punches.entryTime);
    const end = parseHHMM(punches.exitTime);
    const span = Math.max(1, end - start);
    const bStart = parseHHMM(punches.breakStart);
    const bEnd = parseHHMM(punches.breakEnd);
    const p1Left = ((bStart - start) / span) * 100;
    const breakLeft = ((bStart - start) / span) * 100;
    const breakW = ((bEnd - bStart) / span) * 100;
    const p2Left = ((bEnd - start) / span) * 100;
    const p2W = ((end - bEnd) / span) * 100;

    return (
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-[color:var(--border)]">
        <div
          className="absolute inset-y-0 rounded-full bg-[color:var(--status-success)]"
          style={{ left: 0, width: `${p1Left}%` }}
        />
        <div
          className="absolute inset-y-0 bg-[color:var(--text-muted)]/35"
          style={{ left: `${breakLeft}%`, width: `${Math.max(breakW, 1)}%` }}
        />
        <div
          className="absolute inset-y-0 rounded-r-full bg-[color:var(--status-success)]"
          style={{ left: `${p2Left}%`, width: `${p2W}%` }}
        />
      </div>
    );
  } catch {
    return null;
  }
}

function SuggestedBars({
  blocos,
}: {
  blocos: Array<{ inicio: string; fim: string }>;
}) {
  if (blocos.length === 0) return null;
  try {
    const starts = blocos.map((b) => parseHHMM(b.inicio));
    const ends = blocos.map((b) => parseHHMM(b.fim));
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const span = Math.max(1, max - min);

    return (
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full border border-dashed border-sky-400/50 bg-sky-500/5">
        {blocos.map((b, i) => {
          const left = ((parseHHMM(b.inicio) - min) / span) * 100;
          const width = ((parseHHMM(b.fim) - parseHHMM(b.inicio)) / span) * 100;
          return (
            <div
              key={i}
              className="absolute inset-y-0 rounded-full border border-dashed border-sky-400 bg-sky-400/30"
              style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
            />
          );
        })}
      </div>
    );
  } catch {
    return null;
  }
}

function SemanaSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy>
      <div className="flex justify-between gap-3">
        <Skeleton shape="line" className="h-8 w-56" />
        <Skeleton shape="rect" className="h-10 w-40" />
      </div>
      <Skeleton shape="rect" className="h-40" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} shape="rect" className="h-20" />
        ))}
      </div>
      <Skeleton shape="rect" className="h-56" />
    </div>
  );
}

export default function SemanaPage() {
  const today = todayDateOnly();
  const currentWeek = getWeekStart(today);
  const [week, setWeek] = useState(currentWeek);
  const [data, setData] = useState<PlanningResponse | null>(null);
  const [resumo, setResumo] = useState<ReturnType<typeof calcularResumoSemana> | null>(null);
  const [entryIds, setEntryIds] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [slideDir, setSlideDir] = useState<"left" | "right" | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    setError("");
    const weekEndDate = new Date(week + "T00:00:00Z");
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const to = weekEndDate.toISOString().slice(0, 10);

    Promise.all([
      fetch(`/api/planning?week=${week}`).then((r) => r.json()),
      fetch(`/api/punches?from=${week}&to=${to}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([planningRes, punches, settings]) => {
        if (planningRes.error) throw new Error(planningRes.error);
        setData(planningRes);
        const list = Array.isArray(punches) ? punches : [];
        const ids: Record<string, string> = {};
        for (const p of list) ids[p.date] = p.id;
        setEntryIds(ids);
        setResumo(calcularResumoSemana(list, settings, week));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [week]);

  function shiftWeek(delta: number) {
    setSlideDir(delta > 0 ? "left" : "right");
    setAnimKey((k) => k + 1);
    const d = new Date(week + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta * 7);
    setWeek(d.toISOString().slice(0, 10));
    setExpanded({});
  }

  const suggestionsByDate = useMemo(() => {
    const map = new Map<
      string,
      PlanningResponse["planning"]["sugestoes"][number]
    >();
    for (const s of data?.planning.sugestoes ?? []) map.set(s.data, s);
    return map;
  }, [data]);

  const metaAnim = useCountUp(resumo?.metaMinutos ?? 0);
  const workedAnim = useCountUp(resumo?.trabalhadoMinutos ?? 0);
  const faltaAnim = useCountUp(resumo?.faltaMinutos ?? 0);
  const saldoAnim = useCountUp(resumo?.saldoMinutos ?? 0);
  const bancoAnim = useCountUp(data?.bank.saldoAtual ?? 0);

  if (error) {
    return (
      <PageTransition>
        <AlertBanner type="danger" message={error} dismissible />
      </PageTransition>
    );
  }
  if (loading || !data || !resumo) {
    return (
      <PageTransition>
        <SemanaSkeleton />
      </PageTransition>
    );
  }

  const { planning, bank } = data;
  const isCurrentWeek = week === currentWeek;
  const weekPct =
    resumo.metaMinutos > 0
      ? Math.round((resumo.trabalhadoMinutos / resumo.metaMinutos) * 100)
      : 0;

  const statusBadge =
    resumo.trabalhadoMinutos >= resumo.metaMinutos
      ? { label: "Meta batida 🎉", color: "emerald" as const }
      : weekPct >= 60 || resumo.faltaMinutos === 0
        ? { label: "No caminho ✓", color: "sky" as const }
        : { label: "Atrás da meta ⚠", color: "amber" as const };

  const projectedBank =
    planning.bancoProjetado ??
    bank.saldoAnterior +
      (planning.previsaoFechamentoMinutos - planning.metaMinutos);

  return (
    <PageTransition>
      <ContentFade className="space-y-6">
      <PageHeader
        title="Planejamento semanal"
        description="Resumo da semana, saldo e sugestão de compensação."
        action={
          <div className="flex items-center gap-2">
            {isCurrentWeek ? (
              <Badge color="emerald" className="animate-pulse-soft hidden sm:inline-flex">
                Esta semana
              </Badge>
            ) : null}
            <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] p-1 shadow-sm">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                aria-label="Semana anterior"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlideDir(null);
                  setAnimKey((k) => k + 1);
                  setWeek(currentWeek);
                  setExpanded({});
                }}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-muted)]"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                aria-label="Próxima semana"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-muted)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      />

      <div
        key={animKey}
        className={cn(
          "space-y-6",
          slideDir === "left" && "animate-slide-in-right",
          slideDir === "right" && "animate-slide-down",
          !slideDir && "animate-fade-in"
        )}
      >
        {/* Hero */}
        <Card variant="glass" className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--brand) 30%, transparent), transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                  Semana
                </p>
                <p className="font-[family-name:var(--font-display)] text-xl text-[color:var(--text)]">
                  {formatDateBR(resumo.weekStart)} – {formatDateBR(resumo.weekEnd)}
                </p>
              </div>
              <Badge color={statusBadge.color}>{statusBadge.label}</Badge>
            </div>

            <ProgressBar value={weekPct} showLabel className="mb-5" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Reveal delay={0}>
                <HeroMetric label="Meta" value={formatMinutesLong(metaAnim)} />
              </Reveal>
              <Reveal delay={70}>
                <HeroMetric
                  label="Trabalhado"
                  value={formatMinutesLong(workedAnim)}
                  tone="text-[color:var(--brand)]"
                />
              </Reveal>
              <Reveal delay={140}>
                <HeroMetric
                  label="Faltam"
                  value={formatMinutesLong(faltaAnim)}
                  tone="text-[color:var(--status-warning)]"
                />
              </Reveal>
              <Reveal delay={210}>
                <HeroMetric
                  label="Saldo"
                  value={formatMinutesLong(saldoAnim, true)}
                  tone={
                    resumo.saldoMinutos >= 0
                      ? "text-[color:var(--status-success)]"
                      : "text-[color:var(--status-danger)]"
                  }
                />
              </Reveal>
              <Reveal delay={280} className="col-span-2 lg:col-span-1">
                <HeroMetric
                  label="Banco"
                  value={formatMinutesLong(bancoAnim, true)}
                  tone={
                    bank.saldoAtual >= 0
                      ? "text-[color:var(--status-success)]"
                      : "text-[color:var(--status-danger)]"
                  }
                />
              </Reveal>
            </div>
          </div>
        </Card>

        {planning.alerta ? (
          <div className="animate-slide-down">
            <AlertBanner
              type={planning.viavel ? "warning" : "danger"}
              message={planning.alerta}
              dismissible
            />
          </div>
        ) : null}

        {/* Daily timeline */}
        <Card>
          <h2 className="mb-5 text-sm font-semibold text-[color:var(--text)]">
            Timeline da semana
          </h2>
          <RevealStagger
            className="relative space-y-0 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-[color:var(--border)]"
            step={40}
          >
            {resumo.porDia.map((day) => {
              const suggestion = suggestionsByDate.get(day.date);
              const open = expanded[day.date] ?? false;
              return (
                <div key={day.date} className="relative pl-10">
                  <span
                    className={cn(
                      "absolute left-2 top-5 h-3.5 w-3.5 rounded-full ring-4 ring-[color:var(--surface)]",
                      dayStatusColor(day, today)
                    )}
                  />

                  <div
                    className={cn(
                      "mb-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 p-4 transition-colors",
                      open && "bg-[color:var(--surface)]"
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 text-left"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [day.date]: !prev[day.date],
                        }))
                      }
                      aria-expanded={open}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold uppercase tracking-wide text-[color:var(--text)]">
                            {day.weekdayName}
                          </p>
                          <span className="text-xs text-[color:var(--text-muted)]">
                            {formatDateBR(day.date)}
                          </span>
                          {day.date === today ? (
                            <Badge color="sky" size="sm">
                              Hoje
                            </Badge>
                          ) : null}
                        </div>

                        {day.registered && day.punches ? (
                          <>
                            <WorkBar punches={day.punches} />
                            <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                              {day.punches.entryTime} → {day.punches.exitTime} ·{" "}
                              {formatMinutesLong(day.workedMinutes)}
                            </p>
                          </>
                        ) : suggestion ? (
                          <>
                            <SuggestedBars blocos={suggestion.blocos} />
                            <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
                              Sugestão: {formatMinutesLong(suggestion.minutos)}
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                            Ainda não registrado
                          </p>
                        )}
                      </div>

                      <ChevronDown
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition-transform",
                          open && "rotate-180"
                        )}
                      />
                    </button>

                    {open ? (
                      <div className="mt-4 space-y-3 border-t border-[color:var(--border)] pt-4 animate-fade-in">
                        {day.registered ? (
                          <div className="grid gap-2 text-sm sm:grid-cols-3">
                            <Detail
                              label="Trabalhado"
                              value={formatMinutesLong(day.workedMinutes)}
                            />
                            <Detail
                              label="Meta"
                              value={formatMinutesLong(day.dailyGoalMinutes)}
                            />
                            <Detail
                              label="Saldo"
                              value={formatMinutesLong(day.balanceMinutes, true)}
                              tone={
                                day.balanceMinutes >= 0
                                  ? "text-[color:var(--status-success)]"
                                  : "text-[color:var(--status-danger)]"
                              }
                            />
                          </div>
                        ) : suggestion ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                              {suggestion.blocos.map((b, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-sky-400/60 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-800 dark:text-sky-200"
                                >
                                  <Clock className="h-3 w-3" />
                                  {b.inicio} → {b.fim}
                                </span>
                              ))}
                            </div>
                            {suggestion.aulas.map((a, i) => (
                              <span
                                key={i}
                                className="mr-1.5 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
                              >
                                <BookOpen className="h-3 w-3" />
                                {a.name} {a.startTime}–{a.endTime}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {day.registered && entryIds[day.date] ? (
                            <Link href={`/ponto?id=${entryIds[day.date]}`}>
                              <Button type="button" variant="secondary">
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Button>
                            </Link>
                          ) : (
                            <Link href="/ponto">
                              <Button type="button">
                                <Plus className="h-4 w-4" />
                                Registrar
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </RevealStagger>
        </Card>

        {/* Smart planner */}
        <Reveal>
        <div
          className="rounded-2xl p-[1px]"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--brand) 55%, transparent), color-mix(in oklab, var(--status-info) 40%, transparent))",
          }}
        >
          <Card className="!border-0 bg-[color:var(--surface)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-xl bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[color:var(--text)]">
                Sugestão Inteligente
              </h2>
            </div>

            {!planning.viavel && planning.alerta ? (
              <div className="mb-4">
                <AlertBanner type="danger" message={planning.alerta} dismissible />
              </div>
            ) : null}

            {planning.restanteMinutos > 0 ? (
              <p className="mb-4 text-sm text-[color:var(--text-secondary)]">
                Você está devendo:{" "}
                <strong className="text-[color:var(--text)]">
                  {formatMinutesLong(planning.restanteMinutos)}
                </strong>
              </p>
            ) : (
              <p className="mb-4 text-sm text-[color:var(--status-success)]">
                Meta da semana atingida ou superada.
              </p>
            )}

            <div className="space-y-3">
              {planning.sugestoes.map((s, i) => (
                <div
                  key={s.data}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3 animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[color:var(--text)]">
                      {s.weekdayName} · {formatDateBR(s.data)}
                    </p>
                    {s.deltaVsPadrao !== 0 ? (
                      <Badge
                        color={s.deltaVsPadrao > 0 ? "emerald" : "amber"}
                        size="sm"
                      >
                        {formatMinutesLong(s.deltaVsPadrao, true)} vs padrão
                      </Badge>
                    ) : (
                      <Badge color="slate" size="sm">
                        no padrão
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {s.blocos.map((b, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--brand)]"
                      >
                        <Clock className="h-3 w-3" />
                        {b.inicio} → {b.fim}
                      </span>
                    ))}
                    {s.aulas.map((a, idx) => (
                      <span
                        key={`a-${idx}`}
                        className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
                      >
                        📚 {a.name} {a.startTime}-{a.endTime}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                    {formatMinutesLong(s.minutos)} trabalhadas sugeridas
                  </p>
                </div>
              ))}
            </div>

            {planning.sugestoes.length > 0 || planning.restanteMinutos === 0 ? (
              <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--brand-soft)] px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-[color:var(--text-muted)]">
                  Projeção de fechamento
                </p>
                <p className="mt-1 text-lg font-semibold text-[color:var(--text)]">
                  Previsão: {formatMinutesLong(planning.previsaoFechamentoMinutos)}
                </p>
                <p className="mt-1 text-sm text-[color:var(--text-secondary)]">
                  Com este plano, seu banco ficará em{" "}
                  <strong
                    className={
                      projectedBank >= 0
                        ? "text-[color:var(--status-success)]"
                        : "text-[color:var(--status-danger)]"
                    }
                  >
                    {formatMinutesLong(projectedBank, true)}
                  </strong>
                </p>
                {planning.sugestoes.length > 0 ? (
                  <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                    Total sugerido:{" "}
                    {formatMinutesLong(
                      planning.sugestoes.reduce((a, s) => a + s.minutos, 0)
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
        </Reveal>
      </div>
      </ContentFade>
    </PageTransition>
  );
}

function HeroMetric({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-3 py-3",
        className
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums text-[color:var(--text)] sm:text-xl",
          tone
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-muted)]">
        {label}
      </p>
      <p className={cn("font-semibold tabular-nums", tone)}>{value}</p>
    </div>
  );
}
