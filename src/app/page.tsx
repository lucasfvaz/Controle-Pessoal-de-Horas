"use client";

import { useEffect, useState } from "react";
import {
  AlertBanner,
  Card,
  PageHeader,
  ProgressBar,
  ProgressRing,
  SkeletonCard,
  StatCard,
} from "@/components/ui";
import { formatDateBR, formatMinutesLong } from "@/domain/time";
import {
  Clock3,
  Target,
  Scale,
  Wallet,
  TimerReset,
} from "lucide-react";
import {
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

  if (error) {
    return (
      <AlertBanner type="danger" message={error} dismissible />
    );
  }
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const { resumo, bank, planning, alerts, charts } = data;
  const horasCompensar = planning.restanteMinutos;
  const weekPct =
    resumo.metaMinutos > 0
      ? Math.round((resumo.trabalhadoMinutos / resumo.metaMinutos) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Semana ${formatDateBR(resumo.weekStart)} – ${formatDateBR(resumo.weekEnd)}`}
        action={
          <ProgressRing
            value={resumo.trabalhadoMinutos}
            max={resumo.metaMinutos || 1}
            label="meta"
          />
        }
      />

      <div className="mb-6 space-y-2">
        {alerts.map((a, i) => (
          <AlertBanner key={i} type={a.type} message={a.message} dismissible />
        ))}
      </div>

      <Card variant="glass" className="mb-6">
        <ProgressBar value={weekPct} showLabel />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Horas trabalhadas esta semana"
          value={formatMinutesLong(resumo.trabalhadoMinutos)}
          tone="accent"
          icon={Clock3}
        />
        <StatCard
          label="Meta semanal"
          value={formatMinutesLong(resumo.metaMinutos)}
          icon={Target}
        />
        <StatCard
          label="Saldo da semana"
          value={formatMinutesLong(resumo.saldoMinutos, true)}
          tone={resumo.saldoMinutos >= 0 ? "positive" : "negative"}
          icon={Scale}
        />
        <StatCard
          label="Banco de horas"
          value={formatMinutesLong(bank.saldoAtual, true)}
          hint={bank.status}
          tone={bank.saldoAtual >= 0 ? "positive" : "negative"}
          icon={Wallet}
        />
        <StatCard
          label="Horas a compensar"
          value={formatMinutesLong(horasCompensar)}
          tone={horasCompensar > 0 ? "negative" : "positive"}
          icon={TimerReset}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[color:var(--text)] transition-colors">
            Meta semanal × Horas trabalhadas
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.week}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                <YAxis
                  tickFormatter={minutesTick}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  width={48}
                />
                <RechartsTooltip formatter={(v) => formatMinutesLong(Number(v))} />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="var(--text-muted)" radius={4} />
                <Bar dataKey="trabalhado" name="Trabalhado" fill="var(--brand)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[color:var(--text)] transition-colors">
            Saldo de banco de horas ao longo do tempo
          </h2>
          <div className="h-64">
            {charts.bankHistory.length === 0 ? (
              <p className="text-sm text-[color:var(--text-muted)]">
                Sem histórico ainda. Registre batidas para ver a evolução.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.bankHistory.map((p) => ({
                    ...p,
                    label: formatDateBR(p.date).slice(0, 5),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis
                    tickFormatter={minutesTick}
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    width={48}
                  />
                  <RechartsTooltip
                    formatter={(v) => formatMinutesLong(Number(v), true)}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="var(--brand)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
