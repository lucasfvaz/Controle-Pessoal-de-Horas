"use client";

import { useEffect, useState } from "react";
import { Badge, Card, PageHeader, StatCard } from "@/components/ui";
import { formatDateBR, formatMinutesLong } from "@/domain/time";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
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

export default function BancoPage() {
  const [data, setData] = useState<BankData | null>(null);

  useEffect(() => {
    fetch("/api/bank")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-slate-500">Carregando…</p>;

  const { bank, history } = data;
  const tone =
    bank.status === "POSITIVO"
      ? "positive"
      : bank.status === "NEGATIVO"
        ? "negative"
        : "neutral";

  return (
    <div>
      <PageHeader
        title="Banco de horas"
        description="Saldo anterior, da semana e atual."
      />

      <div className="mb-4">
        <Badge
          color={
            bank.status === "POSITIVO"
              ? "emerald"
              : bank.status === "NEGATIVO"
                ? "rose"
                : "slate"
          }
        >
          {bank.status}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo anterior"
          value={formatMinutesLong(bank.saldoAnterior, true)}
          tone={bank.saldoAnterior >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Saldo da semana"
          value={formatMinutesLong(bank.saldoSemana, true)}
          tone={bank.saldoSemana >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Saldo atual"
          value={formatMinutesLong(bank.saldoAtual, true)}
          tone={tone}
        />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-sm font-semibold">Evolução</h2>
        <div className="h-72">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history.map((h) => ({
                  ...h,
                  label: formatDateBR(h.date).slice(0, 5),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => formatMinutesLong(Number(v))}
                  tick={{ fontSize: 11 }}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => formatMinutesLong(Number(v), true)}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
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
  );
}
