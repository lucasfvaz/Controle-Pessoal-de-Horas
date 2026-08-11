"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  ProgressRing,
  Skeleton,
  Tabs,
} from "@/components/ui";
import { formatDateBR, formatMinutesLong } from "@/domain/time";
import { cn } from "@/lib/utils";
import {
  History,
  Minus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

type BankData = {
  bank: {
    saldoAnterior: number;
    saldoSemana: number;
    saldoAtual: number;
    status: "POSITIVO" | "NEGATIVO" | "ZERADO";
  };
  history: Array<{ date: string; saldo: number }>;
};

type Period = "30" | "90" | "all";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  if (points.length < 2) {
    return <div className="mt-3 h-9 rounded-lg bg-[color:var(--surface-muted)]" />;
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-9 w-full" aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={positive ? "var(--status-success)" : "var(--status-danger)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs shadow-[var(--shadow-lg)]">
      <p className="mb-1 font-medium text-[color:var(--text)]">{label}</p>
      <p
        className={cn(
          "font-semibold tabular-nums",
          value >= 0
            ? "text-[color:var(--status-success)]"
            : "text-[color:var(--status-danger)]"
        )}
      >
        {formatMinutesLong(value, true)}
      </p>
    </div>
  );
}

function BancoSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy>
      <Card variant="glass" className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Skeleton shape="circle" className="h-36 w-36 shrink-0" />
        <div className="w-full space-y-3">
          <Skeleton shape="line" className="h-4 w-32" />
          <Skeleton shape="line" className="h-12 w-48" />
          <Skeleton shape="line" className="h-4 w-72" />
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton shape="rect" className="h-36" />
        <Skeleton shape="rect" className="h-36" />
      </div>
      <Skeleton shape="chart" />
    </div>
  );
}

function sampleWeekly(history: Array<{ date: string; saldo: number }>, weeks = 4) {
  if (history.length === 0) return [];
  const step = Math.max(1, Math.floor(history.length / weeks));
  const points: number[] = [];
  for (let i = Math.max(0, history.length - weeks * step); i < history.length; i += step) {
    points.push(history[i].saldo);
  }
  if (points[points.length - 1] !== history[history.length - 1].saldo) {
    points.push(history[history.length - 1].saldo);
  }
  return points.slice(-weeks);
}

function buildInsights(history: Array<{ date: string; saldo: number }>) {
  if (history.length < 2) return null;

  const last = history[history.length - 1].saldo;
  const twoWeeksAgoIdx = Math.max(0, history.length - 14);
  const past = history[twoWeeksAgoIdx].saldo;
  const delta = last - past;

  const recent = history.slice(-7);
  const firstRecent = recent[0].saldo;
  const weeklyPace =
    recent.length > 1
      ? (recent[recent.length - 1].saldo - firstRecent) / Math.max(1, recent.length - 1)
      : 0;
  // extrapolate ~28 days
  const projectedDelta = Math.round(weeklyPace * 28);
  const projected = last + projectedDelta;

  return {
    delta,
    projected,
    projectedDelta,
  };
}

export default function BancoPage() {
  const router = useRouter();
  const [data, setData] = useState<BankData | null>(null);
  const [period, setPeriod] = useState<Period>("30");

  useEffect(() => {
    fetch("/api/bank")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const filteredHistory = useMemo(() => {
    if (!data) return [];
    const hist = data.history;
    if (period === "all") return hist;
    const days = period === "30" ? 30 : 90;
    return hist.slice(-days);
  }, [data, period]);

  const chartData = useMemo(
    () =>
      filteredHistory.map((h) => ({
        ...h,
        label: formatDateBR(h.date).slice(0, 5),
      })),
    [filteredHistory]
  );

  const saldoAnim = useCountUp(data?.bank.saldoAtual ?? 0);
  const insights = useMemo(
    () => (data ? buildInsights(data.history) : null),
    [data]
  );

  if (!data) return <BancoSkeleton />;

  const { bank, history } = data;
  const isPositive = bank.saldoAtual > 0;
  const isNegative = bank.saldoAtual < 0;
  const StatusIcon = isPositive
    ? TrendingUp
    : isNegative
      ? TrendingDown
      : Minus;

  const ringMax = Math.max(
    2400,
    Math.abs(bank.saldoAtual),
    Math.abs(bank.saldoAnterior),
    1
  );
  const ringValue = Math.abs(bank.saldoAtual);

  const prevSpark = sampleWeekly(history, 4);
  const weekSpark = history.slice(-7).map((h) => h.saldo);

  const tabItems = [
    {
      id: "30",
      label: "30 dias",
      content: null as React.ReactNode,
    },
    {
      id: "90",
      label: "90 dias",
      content: null as React.ReactNode,
    },
    {
      id: "all",
      label: "Tudo",
      content: null as React.ReactNode,
    },
  ].map((t) => ({
    ...t,
    content: (
      <div className="h-72 animate-fade-in">
        {chartData.length === 0 ? (
          <EmptyState
            icon={History}
            title="Sem histórico ainda"
            description="Registre seus primeiros pontos para acompanhar a evolução do banco de horas."
            actionLabel="Registrar ponto"
            onAction={() => router.push("/ponto")}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="bankPosArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--status-success)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--status-success)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="bankNegArea" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="var(--status-danger)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--status-danger)" stopOpacity={0.02} />
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
                tickFormatter={(v) => formatMinutesLong(Number(v))}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="var(--border-strong)" strokeDasharray="4 4" />
              <RechartsTooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke="none"
                fill={isNegative ? "url(#bankNegArea)" : "url(#bankPosArea)"}
                isAnimationActive
                animationDuration={1200}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke={
                  isNegative ? "var(--status-danger)" : "var(--status-success)"
                }
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: isNegative ? "var(--status-danger)" : "var(--status-success)" }}
                activeDot={{ r: 6 }}
                isAnimationActive
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de horas"
        description="Saldo anterior, da semana e atual."
      />

      {/* Hero */}
      <Card variant="glass" className="relative overflow-hidden animate-scale-in">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40"
          style={{
            background: isNegative
              ? "radial-gradient(circle, color-mix(in oklab, var(--status-danger) 35%, transparent), transparent 70%)"
              : "radial-gradient(circle, color-mix(in oklab, var(--status-success) 35%, transparent), transparent 70%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-8 sm:flex-row">
          <div
            className={cn(
              "[&_circle:last-of-type]:transition-[stroke]",
              isNegative && "[&_circle:last-of-type]:![stroke:var(--status-danger)]",
              isPositive && "[&_circle:last-of-type]:![stroke:var(--status-success)]",
              !isPositive && !isNegative && "[&_circle:last-of-type]:![stroke:var(--text-muted)]"
            )}
          >
            <ProgressRing
              value={ringValue}
              max={ringMax}
              size={148}
              strokeWidth={12}
              label="saldo"
            />
          </div>

          <div className="w-full min-w-0 flex-1 text-center sm:text-left">
            <div className="mb-2 inline-flex items-center gap-2">
              <Badge
                color={
                  bank.status === "POSITIVO"
                    ? "emerald"
                    : bank.status === "NEGATIVO"
                      ? "rose"
                      : "slate"
                }
                className="animate-pulse-soft"
              >
                <span className="inline-flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {bank.status}
                </span>
              </Badge>
            </div>

            <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
              Saldo atual
            </p>
            <p
              key={bank.saldoAtual}
              className={cn(
                "mt-1 text-5xl font-semibold tabular-nums tracking-tight animate-fade-in",
                isPositive && "text-[color:var(--status-success)]",
                isNegative && "text-[color:var(--status-danger)]",
                !isPositive && !isNegative && "text-[color:var(--text)]"
              )}
            >
              {formatMinutesLong(saldoAnim, true)}
            </p>

            <p className="mt-3 text-sm text-[color:var(--text-secondary)]">
              Saldo anterior:{" "}
              <span className="font-medium tabular-nums text-[color:var(--text)]">
                {formatMinutesLong(bank.saldoAnterior, true)}
              </span>
              {" + "}
              Esta semana:{" "}
              <span className="font-medium tabular-nums text-[color:var(--text)]">
                {formatMinutesLong(bank.saldoSemana, true)}
              </span>
              {" = "}
              Total:{" "}
              <span className="font-semibold tabular-nums text-[color:var(--text)]">
                {formatMinutesLong(bank.saldoAtual, true)}
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Secondary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                Saldo anterior
              </p>
              <p
                className={cn(
                  "mt-2 text-3xl font-semibold tabular-nums",
                  bank.saldoAnterior >= 0
                    ? "text-[color:var(--status-success)]"
                    : "text-[color:var(--status-danger)]"
                )}
              >
                {formatMinutesLong(bank.saldoAnterior, true)}
              </p>
            </div>
            <span className="rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <Sparkline points={prevSpark} positive={bank.saldoAnterior >= 0} />
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
                Saldo da semana
              </p>
              <p
                className={cn(
                  "mt-2 text-3xl font-semibold tabular-nums",
                  bank.saldoSemana >= 0
                    ? "text-[color:var(--status-success)]"
                    : "text-[color:var(--status-danger)]"
                )}
              >
                {formatMinutesLong(bank.saldoSemana, true)}
              </p>
            </div>
            <span className="rounded-lg bg-[color:var(--brand-soft)] p-2 text-[color:var(--brand)]">
              {bank.saldoSemana >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </span>
          </div>
          <Sparkline points={weekSpark} positive={bank.saldoSemana >= 0} />
        </Card>
      </div>

      {/* Chart */}
      <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[color:var(--text)]">
            Evolução do banco
          </h2>
        </div>
        <Tabs
          items={tabItems}
          defaultTab={period}
          onChange={(id) => setPeriod(id as Period)}
        />
      </Card>

      {/* Insights */}
      {history.length > 0 && insights ? (
        <Card variant="muted" className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <h2 className="mb-3 text-sm font-semibold text-[color:var(--text)]">
            Insights
          </h2>
          <div className="space-y-3 text-sm text-[color:var(--text-secondary)]">
            <p>
              <span className="font-medium text-[color:var(--text)]">Tendência:</span>{" "}
              {insights.delta > 0 ? (
                <>
                  ↑ Seu saldo aumentou{" "}
                  <strong className="text-[color:var(--status-success)]">
                    {formatMinutesLong(insights.delta)}
                  </strong>{" "}
                  nas últimas 2 semanas
                </>
              ) : insights.delta < 0 ? (
                <>
                  ↓ Seu saldo caiu{" "}
                  <strong className="text-[color:var(--status-danger)]">
                    {formatMinutesLong(Math.abs(insights.delta))}
                  </strong>{" "}
                  nas últimas 2 semanas
                </>
              ) : (
                <>→ Seu saldo se manteve estável nas últimas 2 semanas</>
              )}
            </p>
            <p>
              <span className="font-medium text-[color:var(--text)]">Projeção:</span>{" "}
              Se mantiver o ritmo atual, em 4 semanas terá{" "}
              <strong
                className={
                  insights.projected >= 0
                    ? "text-[color:var(--status-success)]"
                    : "text-[color:var(--status-danger)]"
                }
              >
                {formatMinutesLong(insights.projected, true)}
              </strong>
              {insights.projectedDelta !== 0 ? (
                <>
                  {" "}
                  ({formatMinutesLong(insights.projectedDelta, true)} vs hoje)
                </>
              ) : null}
            </p>
          </div>
        </Card>
      ) : history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Comece a construir seu banco"
          description="Ainda não há evolução registrada. Lance suas primeiras batidas para ver o saldo ao longo do tempo."
          actionLabel="Registrar ponto"
          onAction={() => router.push("/ponto")}
        />
      ) : null}
    </div>
  );
}
