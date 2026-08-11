"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertBanner,
  Card,
  PageHeader,
  ProgressRing,
  Skeleton,
  SkeletonCard,
  StatCard,
} from "@/components/ui";
import {
  PageTransition,
  Reveal,
  RevealStagger,
  ContentFade,
} from "@/components/motion";
import { useCountUp } from "@/hooks/use-count-up";
import { formatDateBR, formatMinutesLong } from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  Clock,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardData = {
  resumo: {
    weekStart: string;
    weekEnd: string;
    metaMinutos: number;
    trabalhadoMinutos: number;
    faltaMinutos: number;
    saldoMinutos: number;
  };
  bank: {
    saldoAnterior: number;
    saldoSemana: number;
    saldoAtual: number;
    status: string;
  };
  planning: {
    restanteMinutos: number;
    viavel: boolean;
  };
  alerts: Array<{
    type: "info" | "warning" | "success" | "danger";
    message: string;
  }>;
  charts: {
    week: Array<{ name: string; meta: number; trabalhado: number }>;
    bankHistory: Array<{ date: string; saldo: number }>;
  };
};

function minutesTick(v: number) {
  return formatMinutesLong(v);
}

function ChartTooltip({
  active,
  payload,
  label,
  signed = false,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  signed?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs shadow-[var(--shadow-lg)]">
      {label ? (
        <p className="mb-1 font-medium text-[color:var(--text)]">{label}</p>
      ) : null}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <p key={i} className="text-[color:var(--text-secondary)]">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            {p.name}:{" "}
            <span className="font-semibold text-[color:var(--text)]">
              {formatMinutesLong(Number(p.value ?? 0), signed)}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <div className="mt-3 h-10 rounded-lg bg-[color:var(--surface-muted)]" />
    );
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const w = 120;
  const h = 36;
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastUp = points[points.length - 1] >= points[0];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 h-9 w-full overflow-visible"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={lastUp ? "var(--status-success)" : "var(--status-danger)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy aria-label="Carregando dashboard">
      <div className="space-y-2">
        <Skeleton shape="line" className="h-8 w-48" />
        <Skeleton shape="line" className="h-4 w-72" />
      </div>

      <Card variant="glass" className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton shape="circle" className="h-36 w-36 shrink-0" />
        <div className="w-full space-y-3">
          <Skeleton shape="line" className="h-4 w-40" />
          <Skeleton shape="line" className="h-10 w-56" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton shape="rect" className="h-16" />
            <Skeleton shape="rect" className="h-16" />
            <Skeleton shape="rect" className="h-16" />
          </div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} shape="rect" className="h-16" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton shape="chart" />
        <Skeleton shape="chart" />
      </div>
    </div>
  );
}

const quickActions = [
  {
    href: "/ponto",
    label: "Registrar ponto",
    description: "Lançar as 4 batidas",
    icon: Plus,
  },
  {
    href: "/semana",
    label: "Ver semana",
    description: "Planejamento e sugestões",
    icon: CalendarRange,
  },
  {
    href: "/banco",
    label: "Banco de horas",
    description: "Saldo acumulado",
    icon: Wallet,
  },
  {
    href: "/calendario",
    label: "Calendário",
    description: "Visão mensal",
    icon: CalendarDays,
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then(async (r) => {
        if (!r.ok) throw new Error("Falha ao carregar dashboard");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const workedTarget = data?.resumo.trabalhadoMinutos ?? 0;
  const metaTarget = data?.resumo.metaMinutos ?? 0;
  const saldoTarget = data?.resumo.saldoMinutos ?? 0;
  const bankTarget = data?.bank.saldoAtual ?? 0;

  const workedAnim = useCountUp(workedTarget);
  const metaAnim = useCountUp(metaTarget);
  const saldoAnim = useCountUp(saldoTarget);
  const bankAnim = useCountUp(bankTarget);
  const compensarAnim = useCountUp(data?.planning.restanteMinutos ?? 0);

  const sparkPoints = useMemo(() => {
    const hist = data?.charts.bankHistory ?? [];
    return hist.slice(-7).map((p) => p.saldo);
  }, [data]);

  if (error) {
    return (
      <PageTransition>
        <AlertBanner type="danger" message={error} dismissible />
      </PageTransition>
    );
  }
  if (!data) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  const { resumo, bank, planning, alerts, charts } = data;
  const horasCompensar = planning.restanteMinutos;
  const SaldoIcon = resumo.saldoMinutos >= 0 ? TrendingUp : TrendingDown;
  const weekPct =
    resumo.metaMinutos > 0
      ? Math.round((resumo.trabalhadoMinutos / resumo.metaMinutos) * 100)
      : 0;

  const bankLineData = charts.bankHistory.map((p) => ({
    ...p,
    label: formatDateBR(p.date).slice(0, 5),
  }));

  return (
    <PageTransition>
      <ContentFade className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Semana ${formatDateBR(resumo.weekStart)} – ${formatDateBR(resumo.weekEnd)}`}
      />

      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={`${a.type}-${i}`}
              className="animate-slide-down"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <AlertBanner type={a.type} message={a.message} dismissible />
            </div>
          ))}
        </div>
      ) : null}

      {/* Hero */}
      <Card
        variant="glass"
        className="relative overflow-hidden animate-scale-in"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--brand) 35%, transparent), transparent 70%)",
          }}
        />
        <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          <ProgressRing
            value={resumo.trabalhadoMinutos}
            max={Math.max(1, resumo.metaMinutos)}
            size={148}
            strokeWidth={12}
            label="da meta"
            className="shrink-0"
          />

          <div className="w-full min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
              Progresso semanal
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[color:var(--text)] sm:text-4xl">
              {weekPct}%{" "}
              <span className="text-lg text-[color:var(--text-muted)] sm:text-xl">
                da jornada
              </span>
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">
                  Trabalhado
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--brand)]">
                  {formatMinutesLong(workedAnim)}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">
                  Meta
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[color:var(--text)]">
                  {formatMinutesLong(metaAnim)}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-[color:var(--text-muted)]">
                  Saldo
                </p>
                <p
                  className={cn(
                    "mt-1 text-xl font-semibold tabular-nums",
                    saldoTarget >= 0
                      ? "text-[color:var(--status-success)]"
                      : "text-[color:var(--status-danger)]"
                  )}
                >
                  {formatMinutesLong(saldoAnim, true)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[color:var(--text)]">
          Ações rápidas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--brand)] hover:shadow-[var(--shadow-lg)] animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className="inline-flex rounded-xl bg-[color:var(--brand-soft)] p-2.5 text-[color:var(--brand)] transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-[color:var(--text)]">
                  {action.label}
                </p>
                <p className="text-xs text-[color:var(--text-muted)]">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <RevealStagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Horas trabalhadas esta semana"
          value={formatMinutesLong(workedAnim)}
          tone="accent"
          icon={Clock}
        />
        <StatCard
          label="Meta semanal"
          value={formatMinutesLong(metaAnim)}
          icon={Target}
        />
        <StatCard
          label="Saldo da semana"
          value={formatMinutesLong(saldoAnim, true)}
          tone={resumo.saldoMinutos >= 0 ? "positive" : "negative"}
          icon={SaldoIcon}
        />
        <StatCard
          label="Banco de horas"
          value={formatMinutesLong(bankAnim, true)}
          hint={bank.status}
          tone={bank.saldoAtual >= 0 ? "positive" : "negative"}
          icon={Wallet}
        >
          <Sparkline points={sparkPoints} />
        </StatCard>
        <StatCard
          label="Horas a compensar"
          value={formatMinutesLong(compensarAnim)}
          tone={horasCompensar > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
        />
      </RevealStagger>

      {/* Charts */}
      <Reveal className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[color:var(--text)]">
            Meta semanal × Horas trabalhadas
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.week}>
                <defs>
                  <linearGradient id="metaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--text-muted)" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="var(--text-muted)" stopOpacity={0.25} />
                  </linearGradient>
                  <linearGradient id="workGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={minutesTick}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  width={48}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="url(#metaGrad)" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="trabalhado"
                  name="Trabalhado"
                  fill="url(#workGrad)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[color:var(--text)]">
            Saldo de banco de horas ao longo do tempo
          </h2>
          <div className="h-64">
            {bankLineData.length === 0 ? (
              <p className="text-sm text-[color:var(--text-muted)]">
                Sem histórico ainda. Registre batidas para ver a evolução.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bankLineData}>
                  <defs>
                    <linearGradient id="bankArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={minutesTick}
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    width={48}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<ChartTooltip signed />} />
                  <Area
                    type="monotone"
                    dataKey="saldo"
                    stroke="none"
                    fill="url(#bankArea)"
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="var(--brand)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "var(--brand)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </Reveal>
      </ContentFade>
    </PageTransition>
  );
}
