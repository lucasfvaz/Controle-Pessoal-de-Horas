"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertBanner, Card, PageHeader } from "@/components/ui";
import {
  formatDateBR,
  formatMinutesLong,
  getWeekStart,
  todayDateOnly,
} from "@/domain/time";
import { calcularResumoSemana } from "@/domain/journey";

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

export default function SemanaPage() {
  const [week, setWeek] = useState(getWeekStart(todayDateOnly()));
  const [data, setData] = useState<PlanningResponse | null>(null);
  const [resumo, setResumo] = useState<ReturnType<typeof calcularResumoSemana> | null>(null);
  const [entryIds, setEntryIds] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
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
      .catch((e) => setError(e.message));
  }, [week]);

  function shiftWeek(delta: number) {
    const d = new Date(week + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + delta * 7);
    setWeek(d.toISOString().slice(0, 10));
  }

  if (error) return <p className="text-rose-700">{error}</p>;
  if (!data || !resumo) return <p className="text-slate-500">Carregando…</p>;

  const { planning, bank } = data;

  return (
    <div>
      <PageHeader
        title="Planejamento semanal"
        description="Resumo da semana, saldo e sugestão de compensação."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => shiftWeek(-1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setWeek(getWeekStart(todayDateOnly()))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => shiftWeek(1)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              →
            </button>
          </div>
        }
      />

      <Card className="mb-6">
        <p className="text-sm font-medium text-slate-500">
          SEMANA: {formatDateBR(resumo.weekStart)} – {formatDateBR(resumo.weekEnd)}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Meta semanal" value={formatMinutesLong(resumo.metaMinutos)} />
          <Metric label="Trabalhado" value={formatMinutesLong(resumo.trabalhadoMinutos)} />
          <Metric label="Falta trabalhar" value={formatMinutesLong(resumo.faltaMinutos)} />
          <Metric
            label="Saldo semanal"
            value={formatMinutesLong(resumo.saldoMinutos, true)}
            tone={resumo.saldoMinutos >= 0 ? "pos" : "neg"}
          />
          <Metric
            label="Banco de horas"
            value={formatMinutesLong(bank.saldoAtual, true)}
            tone={bank.saldoAtual >= 0 ? "pos" : "neg"}
          />
        </div>
      </Card>

      <div className="mb-6 grid gap-3">
        {resumo.porDia.map((d) => (
          <Card key={d.date} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-semibold uppercase tracking-wide text-emerald-950">
                {d.weekdayName}
              </p>
              <p className="text-xs text-slate-500">{formatDateBR(d.date)}</p>
            </div>
            {d.registered ? (
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Trabalhado: {formatMinutesLong(d.workedMinutes)}</span>
                <span>Meta: {formatMinutesLong(d.dailyGoalMinutes)}</span>
                <span
                  className={
                    d.balanceMinutes >= 0 ? "text-emerald-700" : "text-rose-700"
                  }
                >
                  Saldo: {formatMinutesLong(d.balanceMinutes, true)}
                </span>
                <Link
                  href={`/ponto?id=${entryIds[d.date] ?? ""}`}
                  className="text-emerald-800 underline-offset-2 hover:underline"
                >
                  Editar
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                Ainda não registrado
                <Link href="/ponto" className="text-emerald-800 hover:underline">
                  Registrar
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-emerald-950">
          Sugestão de compensação
        </h2>
        {planning.alerta ? (
          <div className="mt-3">
            <AlertBanner
              type={planning.viavel ? "warning" : "danger"}
              message={planning.alerta}
            />
          </div>
        ) : null}

        {planning.restanteMinutos > 0 ? (
          <p className="mt-4 text-sm">
            Você está devendo:{" "}
            <strong>{formatMinutesLong(planning.restanteMinutos)}</strong>
          </p>
        ) : (
          <p className="mt-4 text-sm text-emerald-800">Meta da semana atingida ou superada.</p>
        )}

        <div className="mt-4 space-y-3">
          {planning.sugestoes.map((s) => (
            <div
              key={s.data}
              className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <p className="font-semibold">
                {s.weekdayName} · {formatDateBR(s.data)}
              </p>
              <div className="mt-2 space-y-1 text-sm">
                {s.blocos.map((b, i) => (
                  <p key={i}>
                    {b.inicio} → {b.fim}
                  </p>
                ))}
                <p className="text-slate-600">
                  {formatMinutesLong(s.minutos)} trabalhadas
                  {s.deltaVsPadrao !== 0
                    ? ` (${formatMinutesLong(s.deltaVsPadrao, true)} vs padrão)`
                    : ""}
                </p>
                {s.aulas.length > 0 ? (
                  <p className="text-xs text-sky-800">
                    Aulas:{" "}
                    {s.aulas
                      .map((a) => `${a.name} ${a.startTime}–${a.endTime}`)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {planning.sugestoes.length > 0 ? (
          <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
            <p>
              Previsão: {formatMinutesLong(planning.previsaoFechamentoMinutos)}
            </p>
            <p>
              Saldo previsto:{" "}
              {formatMinutesLong(
                planning.previsaoFechamentoMinutos - planning.metaMinutos,
                true
              )}
            </p>
            <p>
              Total sugerido:{" "}
              {formatMinutesLong(
                planning.sugestoes.reduce((a, s) => a + s.minutos, 0)
              )}
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tabular-nums ${
          tone === "pos"
            ? "text-emerald-700"
            : tone === "neg"
              ? "text-rose-700"
              : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
