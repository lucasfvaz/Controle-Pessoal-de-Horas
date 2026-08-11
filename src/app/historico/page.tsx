"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { History } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateBR, formatMinutesLong, getWeekStart, todayDateOnly } from "@/domain/time";

type Entry = {
  id: string;
  date: string;
  entryTime: string;
  breakStart: string;
  breakEnd: string;
  exitTime: string;
  workedMinutes: number;
  dayBalanceMinutes: number;
};

export default function HistoricoPage() {
  const router = useRouter();
  const today = todayDateOnly();
  const [from, setFrom] = useState(today.slice(0, 8) + "01");
  const [to, setTo] = useState(today);
  const [balance, setBalance] = useState("all");
  const [preset, setPreset] = useState("month");
  const [entries, setEntries] = useState<Entry[]>([]);

  function applyPreset(value: string) {
    setPreset(value);
    const t = todayDateOnly();
    if (value === "week") {
      const ws = getWeekStart(t);
      const we = new Date(ws + "T00:00:00Z");
      we.setUTCDate(we.getUTCDate() + 6);
      setFrom(ws);
      setTo(we.toISOString().slice(0, 10));
    } else if (value === "month") {
      setFrom(t.slice(0, 8) + "01");
      setTo(t);
    }
  }

  async function load() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (balance !== "all") params.set("balance", balance);
    const data = await fetch(`/api/history?${params}`).then((r) => r.json());
    setEntries(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Histórico"
        description="Consulte e filtre registros de ponto."
      />

      <Card className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Atalho"
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
          >
            <option value="week">Esta semana</option>
            <option value="month">Este mês</option>
            <option value="custom">Personalizado</option>
          </Select>
          <Input
            label="De"
            type="date"
            value={from}
            onChange={(e) => {
              setPreset("custom");
              setFrom(e.target.value);
            }}
          />
          <Input
            label="Até"
            type="date"
            value={to}
            onChange={(e) => {
              setPreset("custom");
              setTo(e.target.value);
            }}
          />
          <Select
            label="Saldo"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="positive">Positivo</option>
            <option value="negative">Negativo</option>
          </Select>
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={load}>
              Filtrar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Entrada</th>
              <th className="px-4 py-3">Intervalo</th>
              <th className="px-4 py-3">Retorno</th>
              <th className="px-4 py-3">Saída</th>
              <th className="px-4 py-3">Trabalhado</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6">
                  <EmptyState
                    icon={History}
                    title="Nenhum registro encontrado"
                    description="Ajuste os filtros ou registre um novo ponto."
                    actionLabel="Registrar ponto"
                    onAction={() => router.push("/ponto")}
                  />
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">{formatDateBR(e.date)}</td>
                  <td className="px-4 py-3">{e.entryTime}</td>
                  <td className="px-4 py-3">{e.breakStart}</td>
                  <td className="px-4 py-3">{e.breakEnd}</td>
                  <td className="px-4 py-3">{e.exitTime}</td>
                  <td className="px-4 py-3">{formatMinutesLong(e.workedMinutes)}</td>
                  <td
                    className={`px-4 py-3 ${
                      e.dayBalanceMinutes >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {formatMinutesLong(e.dayBalanceMinutes, true)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/ponto?id=${e.id}`}
                      className="text-emerald-800 hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
