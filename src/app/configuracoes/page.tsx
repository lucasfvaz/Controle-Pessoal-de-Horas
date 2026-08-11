"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, PageHeader, Select, Toggle } from "@/components/ui";
import { formatMinutesLong } from "@/domain/time";

type Settings = {
  weeklyGoalMinutes: number;
  workDays: string;
  defaultEntry: string;
  defaultExit: string;
  defaultBreakMinutes: number;
  allowCompensation: boolean;
  maxDailyMinutes: number;
  suggestionWindowStart: string;
  suggestionWindowEnd: string;
  bankOpeningBalanceMinutes: number;
};

function minutesToHHMM(total: number): string {
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(total);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmSignedToMinutes(value: string): number {
  const neg = value.startsWith("-");
  const raw = neg ? value.slice(1) : value;
  const [h, m] = raw.split(":").map(Number);
  const mins = h * 60 + m;
  return neg ? -mins : mins;
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [weeklyHours, setWeeklyHours] = useState("40:00");
  const [maxDaily, setMaxDaily] = useState("10:00");
  const [breakMinutes, setBreakMinutes] = useState("01:00");
  const [bankOpen, setBankOpen] = useState("00:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Settings) => {
        setForm(s);
        setWeeklyHours(minutesToHHMM(s.weeklyGoalMinutes));
        setMaxDaily(minutesToHHMM(s.maxDailyMinutes));
        setBreakMinutes(minutesToHHMM(s.defaultBreakMinutes));
        setBankOpen(minutesToHHMM(s.bankOpeningBalanceMinutes));
      });
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setMessage("");
    setError("");
    const payload = {
      ...form,
      weeklyGoalMinutes: hhmmSignedToMinutes(weeklyHours),
      maxDailyMinutes: hhmmSignedToMinutes(maxDaily),
      defaultBreakMinutes: hhmmSignedToMinutes(breakMinutes),
      bankOpeningBalanceMinutes: hhmmSignedToMinutes(bankOpen),
    };
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError("Não foi possível salvar. Verifique os campos.");
      return;
    }
    setForm(data);
    setMessage(
      `Configurações salvas. Meta semanal: ${formatMinutesLong(data.weeklyGoalMinutes)}.`
    );
  }

  if (!form) return <p className="text-slate-500">Carregando…</p>;

  const workDayOptions = [
    { value: "1,2,3,4,5", label: "Segunda a sexta" },
    { value: "1,2,3,4,5,6", label: "Segunda a sábado" },
    { value: "1,2,3,4", label: "Segunda a quinta" },
  ];

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Defina jornada, horários padrão e limites de compensação. Nada fica fixo no código."
      />

      <Card>
        <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Jornada semanal (HH:MM)"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            placeholder="40:00"
          />
          <Select
            label="Dias trabalhados"
            value={form.workDays}
            onChange={(e) => setForm({ ...form, workDays: e.target.value })}
          >
            {workDayOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Entrada padrão"
            type="time"
            value={form.defaultEntry}
            onChange={(e) => setForm({ ...form, defaultEntry: e.target.value })}
          />
          <Input
            label="Saída padrão"
            type="time"
            value={form.defaultExit}
            onChange={(e) => setForm({ ...form, defaultExit: e.target.value })}
          />
          <Input
            label="Intervalo padrão (HH:MM)"
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(e.target.value)}
            placeholder="01:00"
          />
          <div className="flex items-end">
            <Toggle
              label="Permitir compensação de horas"
              checked={form.allowCompensation}
              onChange={(checked) =>
                setForm({ ...form, allowCompensation: checked })
              }
            />
          </div>
          <Input
            label="Limite diário razoável (HH:MM)"
            value={maxDaily}
            onChange={(e) => setMaxDaily(e.target.value)}
            placeholder="10:00"
          />
          <Input
            label="Saldo inicial do banco (HH:MM, use - para negativo)"
            value={bankOpen}
            onChange={(e) => setBankOpen(e.target.value)}
          />
          <Input
            label="Janela sugestão — início"
            type="time"
            value={form.suggestionWindowStart}
            onChange={(e) =>
              setForm({ ...form, suggestionWindowStart: e.target.value })
            }
          />
          <Input
            label="Janela sugestão — fim"
            type="time"
            value={form.suggestionWindowEnd}
            onChange={(e) =>
              setForm({ ...form, suggestionWindowEnd: e.target.value })
            }
          />
          <div className="sm:col-span-2">
            {error ? <p className="mb-2 text-sm text-rose-700">{error}</p> : null}
            {message ? (
              <p className="mb-2 text-sm text-emerald-800">{message}</p>
            ) : null}
            <Button type="submit">Salvar configurações</Button>
          </div>
        </form>
      </Card>

      <HolidaysSection />
    </div>
  );
}

type Holiday = { id: string; date: string; name: string; type: string };

function HolidaysSection() {
  const [items, setItems] = useState<Holiday[]>([]);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("holiday");

  async function load() {
    const data = await fetch("/api/holidays").then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name, type }),
    });
    setDate("");
    setName("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover este dia?")) return;
    await fetch(`/api/holidays/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <Card className="mt-6">
      <h2 className="mb-4 text-sm font-semibold">Feriados / folgas / afastamentos</h2>
      <form onSubmit={add} className="mb-4 grid gap-3 sm:grid-cols-4">
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="holiday">Feriado</option>
          <option value="vacation">Férias</option>
          <option value="day_off">Folga</option>
          <option value="leave">Afastamento</option>
        </Select>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Adicionar
          </Button>
        </div>
      </form>
      <ul className="space-y-2 text-sm">
        {items.length === 0 ? (
          <li className="text-slate-500">Nenhum cadastrado.</li>
        ) : (
          items.map((h) => (
            <li key={h.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>
                {h.date} — {h.name} ({h.type})
              </span>
              <Button type="button" variant="ghost" onClick={() => remove(h.id)}>
                Remover
              </Button>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
