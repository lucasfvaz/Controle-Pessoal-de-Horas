import { getWeekStart, parseDateOnly, toDateOnly } from "./time";

export type BankSnapshot = {
  saldoAnterior: number;
  saldoSemana: number;
  saldoAtual: number;
  status: "POSITIVO" | "NEGATIVO" | "ZERADO";
};

export function statusBanco(saldo: number): BankSnapshot["status"] {
  if (saldo > 0) return "POSITIVO";
  if (saldo < 0) return "NEGATIVO";
  return "ZERADO";
}

/**
 * Calcula o banco de horas até o início da semana de referência.
 * Saldo anterior = abertura + soma dos saldos semanais de semanas já fechadas.
 * Sem registros na semana atual: saldoSemana = 0 (não debita a meta inteira).
 */
export function calcularBancoHoras(params: {
  openingBalanceMinutes: number;
  entries: Array<{ date: string; workedMinutes: number }>;
  weeklyGoalMinutes: number;
  workDaysCount: number;
  weekStart: string;
}): BankSnapshot {
  const { openingBalanceMinutes, entries, weeklyGoalMinutes, weekStart } =
    params;

  const weekGroups = new Map<string, number>();
  for (const e of entries) {
    const ws = getWeekStart(e.date);
    weekGroups.set(ws, (weekGroups.get(ws) ?? 0) + e.workedMinutes);
  }

  let saldoAnterior = openingBalanceMinutes;
  let saldoSemana = 0;

  const sortedWeeks = [...weekGroups.keys()].sort();
  for (const ws of sortedWeeks) {
    const trabalhado = weekGroups.get(ws) ?? 0;
    const saldo = trabalhado - weeklyGoalMinutes;
    if (ws < weekStart) {
      saldoAnterior += saldo;
    } else if (ws === weekStart) {
      saldoSemana = saldo;
    }
  }

  if (!weekGroups.has(weekStart)) {
    saldoSemana = 0;
  }

  const saldoAtual = saldoAnterior + saldoSemana;

  return {
    saldoAnterior,
    saldoSemana,
    saldoAtual,
    status: statusBanco(saldoAtual),
  };
}

/** Evolução do saldo ao longo do tempo (após cada dia registrado). */
export function evolucaoBanco(params: {
  openingBalanceMinutes: number;
  entries: Array<{ date: string; workedMinutes: number }>;
  weeklyGoalMinutes: number;
  workDaysCount: number;
}): Array<{ date: string; saldo: number }> {
  const { openingBalanceMinutes, entries, weeklyGoalMinutes, workDaysCount } =
    params;
  const dailyGoal = Math.round(weeklyGoalMinutes / Math.max(1, workDaysCount));
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let saldo = openingBalanceMinutes;
  const points: Array<{ date: string; saldo: number }> = [];

  for (const e of sorted) {
    saldo += e.workedMinutes - dailyGoal;
    points.push({ date: e.date, saldo });
  }

  return points;
}

export function previousWeekStart(weekStart: string): string {
  const d = parseDateOnly(weekStart);
  d.setUTCDate(d.getUTCDate() - 7);
  return toDateOnly(d);
}
