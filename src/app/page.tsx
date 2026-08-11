"use client";

import { useEffect, useState } from "react";
import {
  AlertBanner,
  Card,
  PageHeader,
  StatCard,
} from "@/components/ui";
import { formatDateBR, formatMinutesLong } from "@/domain/time";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
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
  alerts: Array<{ type: "info" | "warning" | "success" | "danger"; message: string }>;
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
    return <p className="text-rose-700">{error}</p>;
  }
  if (!data) {
    return <p className="text-slate-500">Carregando…</p>;
  }

  const { resumo, bank, planning, alerts, charts } = data;
  const horasCompensar = planning.restanteMinutos;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Semana ${formatDateBR(resumo.weekStart)} – ${formatDateBR(resumo.weekEnd)}`}
      />

      <div className="mb-6 space-y-2">
        {alerts.map((a, i) => (
          <AlertBanner key={i} type={a.type} message={a.message} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Horas trabalhadas esta semana"
          value={formatMinutesLong(resumo.trabalhadoMinutos)}
          tone="accent"
        />
        <StatCard
          label="Meta semanal"
          value={formatMinutesLong(resumo.metaMinutos)}
        />
        <StatCard
          label="Saldo da semana"
          value={formatMinutesLong(resumo.saldoMinutos, true)}
          tone={resumo.saldoMinutos >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Banco de horas"
          value={formatMinutesLong(bank.saldoAtual, true)}
          hint={bank.status}
          tone={bank.saldoAtual >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Horas a compensar"
          value={formatMinutesLong(horasCompensar)}
          tone={horasCompensar > 0 ? "negative" : "positive"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Meta semanal × Horas trabalhadas
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.week}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={minutesTick} tick={{ fontSize: 11 }} width={48} />
                <Tooltip formatter={(v) => formatMinutesLong(Number(v))} />
                <Legend />
                <Bar dataKey="meta" name="Meta" fill="#94a3b8" radius={4} />
                <Bar dataKey="trabalhado" name="Trabalhado" fill="#047857" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-800">
            Saldo de banco de horas ao longo do tempo
          </h2>
          <div className="h-64">
            {charts.bankHistory.length === 0 ? (
              <p className="text-sm text-slate-500">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={minutesTick} tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={(v) => formatMinutesLong(Number(v), true)} />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="#0f766e"
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
