import {
  diffMinutes,
  formatMinutesLong,
  getIsoWeekday,
  getWeekDates,
  getWeekStart,
  parseWorkDays,
} from "./time";

export type PunchTimes = {
  entryTime: string;
  breakStart: string;
  breakEnd: string;
  exitTime: string;
};

export type WorkedPeriods = {
  periodo1: number;
  periodo2: number;
  totalMinutos: number;
};

export type DaySummary = {
  date: string;
  weekday: number;
  weekdayName: string;
  registered: boolean;
  workedMinutes: number;
  dailyGoalMinutes: number;
  balanceMinutes: number;
  notes?: string | null;
  punches?: PunchTimes | null;
};

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  metaMinutos: number;
  trabalhadoMinutos: number;
  faltaMinutos: number;
  saldoMinutos: number;
  dailyGoalMinutes: number;
  porDia: DaySummary[];
};

export type SettingsLike = {
  weeklyGoalMinutes: number;
  workDays: string;
  defaultEntry: string;
  defaultExit: string;
  defaultBreakMinutes: number;
};

export function calcularHorasTrabalhadas(punches: PunchTimes): WorkedPeriods {
  const { entryTime, breakStart, breakEnd, exitTime } = punches;

  if (!(entryTime < breakStart && breakStart <= breakEnd && breakEnd < exitTime)) {
    throw new Error(
      "Ordem inválida das batidas. Esperado: Entrada < Saída intervalo ≤ Retorno < Saída"
    );
  }

  const periodo1 = diffMinutes(entryTime, breakStart);
  const periodo2 = diffMinutes(breakEnd, exitTime);

  return {
    periodo1,
    periodo2,
    totalMinutos: periodo1 + periodo2,
  };
}

export function calcularSaldoDia(
  trabalhadoMinutos: number,
  metaDiariaMinutos: number
): number {
  return trabalhadoMinutos - metaDiariaMinutos;
}

export function metaDiariaReferencia(
  weeklyGoalMinutes: number,
  workDaysCount: number
): number {
  if (workDaysCount <= 0) return weeklyGoalMinutes;
  return Math.round(weeklyGoalMinutes / workDaysCount);
}

export function calcularResumoSemana(
  entries: Array<{
    date: string;
    workedMinutes: number;
    notes?: string | null;
    entryTime?: string;
    breakStart?: string;
    breakEnd?: string;
    exitTime?: string;
  }>,
  settings: SettingsLike,
  weekStart?: string,
  referenceDate?: string
): WeekSummary {
  const workDays = parseWorkDays(settings.workDays);
  const start =
    weekStart ??
    getWeekStart(referenceDate ?? entries[0]?.date ?? "1970-01-01");
  const dates = getWeekDates(start, workDays);
  const weekEnd = dates[dates.length - 1] ?? start;
  const dailyGoal = metaDiariaReferencia(
    settings.weeklyGoalMinutes,
    workDays.length
  );

  const byDate = new Map(entries.map((e) => [e.date, e]));

  const weekdayNames: Record<number, string> = {
    1: "Segunda",
    2: "Terça",
    3: "Quarta",
    4: "Quinta",
    5: "Sexta",
    6: "Sábado",
    7: "Domingo",
  };

  const porDia: DaySummary[] = dates.map((date) => {
    const entry = byDate.get(date);
    const weekday = getIsoWeekday(date);
    if (!entry) {
      return {
        date,
        weekday,
        weekdayName: weekdayNames[weekday],
        registered: false,
        workedMinutes: 0,
        dailyGoalMinutes: dailyGoal,
        balanceMinutes: 0,
      };
    }
    return {
      date,
      weekday,
      weekdayName: weekdayNames[weekday],
      registered: true,
      workedMinutes: entry.workedMinutes,
      dailyGoalMinutes: dailyGoal,
      balanceMinutes: calcularSaldoDia(entry.workedMinutes, dailyGoal),
      notes: entry.notes,
      punches:
        entry.entryTime && entry.breakStart && entry.breakEnd && entry.exitTime
          ? {
              entryTime: entry.entryTime,
              breakStart: entry.breakStart,
              breakEnd: entry.breakEnd,
              exitTime: entry.exitTime,
            }
          : null,
    };
  });

  const trabalhadoMinutos = porDia.reduce((s, d) => s + d.workedMinutes, 0);
  const metaMinutos = settings.weeklyGoalMinutes;
  const faltaMinutos = Math.max(0, metaMinutos - trabalhadoMinutos);
  const saldoMinutos = trabalhadoMinutos - metaMinutos;

  return {
    weekStart: start,
    weekEnd,
    metaMinutos,
    trabalhadoMinutos,
    faltaMinutos,
    saldoMinutos,
    dailyGoalMinutes: dailyGoal,
    porDia,
  };
}

export function describeWorked(worked: WorkedPeriods): string {
  return `${formatMinutesLong(worked.periodo1)} + ${formatMinutesLong(worked.periodo2)} = ${formatMinutesLong(worked.totalMinutos)}`;
}
