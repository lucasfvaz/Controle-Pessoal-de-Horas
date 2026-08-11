import {
  addMinutesToHHMM,
  compareDate,
  formatHHMM,
  formatMinutesLong,
  getIsoWeekday,
  getWeekDates,
  getWeekStart,
  parseHHMM,
  parseWorkDays,
  WEEKDAY_NAMES,
} from "./time";
import { metaDiariaReferencia } from "./journey";

export type PlannerSettings = {
  weeklyGoalMinutes: number;
  workDays: string;
  defaultEntry: string;
  defaultExit: string;
  defaultBreakMinutes: number;
  allowCompensation: boolean;
  maxDailyMinutes: number;
  suggestionWindowStart: string;
  suggestionWindowEnd: string;
};

export type PlannerClass = {
  name: string;
  weekday: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
};

export type PlannerHoliday = {
  date: string;
  name: string;
  type: string;
};

export type PlannerEntry = {
  date: string;
  workedMinutes: number;
};

export type TimeBlock = { inicio: string; fim: string };

export type DaySuggestion = {
  data: string;
  weekdayName: string;
  blocos: TimeBlock[];
  minutos: number;
  deltaVsPadrao: number;
  aulas: Array<{ name: string; startTime: string; endTime: string }>;
};

export type PlanejamentoSemanal = {
  weekStart: string;
  trabalhadoMinutos: number;
  restanteMinutos: number;
  saldoMinutos: number;
  bancoAnterior: number;
  bancoProjetado: number;
  diasDisponiveis: string[];
  periodosDisponiveisPorDia: Record<string, TimeBlock[]>;
  sugestoes: DaySuggestion[];
  previsaoFechamentoMinutos: number;
  viavel: boolean;
  alerta?: string;
  metaMinutos: number;
  capacidadeTotalMinutos: number;
};

function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Subtrai bloqueios (aulas) de uma janela livre. */
export function subtractBlocks(
  free: TimeBlock[],
  blocks: TimeBlock[]
): TimeBlock[] {
  let result = free.map((f) => ({ ...f }));
  for (const block of blocks) {
    const bStart = parseHHMM(block.inicio);
    const bEnd = parseHHMM(block.fim);
    const next: TimeBlock[] = [];
    for (const f of result) {
      const fStart = parseHHMM(f.inicio);
      const fEnd = parseHHMM(f.fim);
      if (!intervalsOverlap(fStart, fEnd, bStart, bEnd)) {
        next.push(f);
        continue;
      }
      if (fStart < bStart) {
        next.push({ inicio: formatHHMM(fStart), fim: formatHHMM(bStart) });
      }
      if (bEnd < fEnd) {
        next.push({ inicio: formatHHMM(bEnd), fim: formatHHMM(fEnd) });
      }
    }
    result = next;
  }
  return result.filter((f) => parseHHMM(f.fim) - parseHHMM(f.inicio) > 0);
}

export function classesForDate(
  date: string,
  classes: PlannerClass[]
): Array<{ name: string; startTime: string; endTime: string }> {
  const weekday = getIsoWeekday(date);
  return classes
    .filter(
      (c) =>
        c.weekday === weekday &&
        compareDate(c.startDate, date) <= 0 &&
        compareDate(date, c.endDate) <= 0
    )
    .map((c) => ({
      name: c.name,
      startTime: c.startTime,
      endTime: c.endTime,
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function blockDuration(b: TimeBlock): number {
  return parseHHMM(b.fim) - parseHHMM(b.inicio);
}

/**
 * Reserva intervalo contínuo no maior gap disponível.
 * Retorna períodos de trabalho após remover o intervalo.
 */
export function reserveBreak(
  freePeriods: TimeBlock[],
  breakMinutes: number
): TimeBlock[] {
  if (breakMinutes <= 0 || freePeriods.length === 0) return freePeriods;

  let bestIdx = 0;
  let bestDur = -1;
  for (let i = 0; i < freePeriods.length; i++) {
    const d = blockDuration(freePeriods[i]);
    if (d > bestDur) {
      bestDur = d;
      bestIdx = i;
    }
  }

  if (bestDur <= breakMinutes) {
    // Sem espaço para intervalo completo: usa o gap inteiro como "intervalo"
    // e remove-o da disponibilidade de trabalho.
    return freePeriods.filter((_, i) => i !== bestIdx);
  }

  const target = freePeriods[bestIdx];
  const start = parseHHMM(target.inicio);
  const end = parseHHMM(target.fim);
  // Coloca o intervalo no meio do maior gap
  const mid = Math.floor((start + end) / 2);
  const breakStart = Math.max(start, mid - Math.floor(breakMinutes / 2));
  const breakEnd = breakStart + breakMinutes;

  const result: TimeBlock[] = [];
  for (let i = 0; i < freePeriods.length; i++) {
    if (i !== bestIdx) {
      result.push(freePeriods[i]);
      continue;
    }
    if (breakStart > start) {
      result.push({ inicio: formatHHMM(start), fim: formatHHMM(breakStart) });
    }
    if (breakEnd < end) {
      result.push({ inicio: formatHHMM(breakEnd), fim: formatHHMM(end) });
    }
  }
  return result;
}

export function availablePeriodsForDay(
  date: string,
  settings: PlannerSettings,
  classes: PlannerClass[]
): { workPeriods: TimeBlock[]; classBlocks: TimeBlock[]; aulas: ReturnType<typeof classesForDate> } {
  const windowStart = settings.suggestionWindowStart;
  const windowEnd = settings.suggestionWindowEnd;
  const aulas = classesForDate(date, classes);
  const classBlocks = aulas.map((a) => ({
    inicio: a.startTime,
    fim: a.endTime,
  }));

  let free = subtractBlocks(
    [{ inicio: windowStart, fim: windowEnd }],
    classBlocks
  );
  free = reserveBreak(free, settings.defaultBreakMinutes);

  return { workPeriods: free, classBlocks, aulas };
}

function dayCapacity(workPeriods: TimeBlock[], maxDaily: number): number {
  const sum = workPeriods.reduce((s, p) => s + blockDuration(p), 0);
  return Math.min(sum, maxDaily);
}

/** Distribui minutos de forma equilibrada respeitando capacidades. */
export function distributeMinutes(
  remaining: number,
  capacities: number[]
): { allocations: number[]; feasible: boolean } {
  const n = capacities.length;
  const allocations = new Array(n).fill(0);
  if (n === 0) {
    return { allocations, feasible: remaining <= 0 };
  }

  let left = remaining;
  const capLeft = [...capacities];

  while (left > 0) {
    const active = capLeft
      .map((c, i) => ({ c, i }))
      .filter((x) => x.c > 0);
    if (active.length === 0) break;

    const base = Math.floor(left / active.length);
    const rem = left % active.length;

    if (base === 0 && rem === 0) break;

    let progressed = false;
    for (let k = 0; k < active.length; k++) {
      const { i } = active[k];
      const want = base + (k < rem ? 1 : 0);
      if (want <= 0) continue;
      const take = Math.min(want, capLeft[i]);
      if (take > 0) {
        allocations[i] += take;
        capLeft[i] -= take;
        left -= take;
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  return { allocations, feasible: left === 0 };
}

/** Converte minutos alocados em blocos de trabalho dentro dos períodos livres. */
export function allocateBlocks(
  workPeriods: TimeBlock[],
  minutes: number
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let left = minutes;
  for (const period of workPeriods) {
    if (left <= 0) break;
    const dur = blockDuration(period);
    const take = Math.min(dur, left);
    if (take <= 0) continue;
    const start = parseHHMM(period.inicio);
    blocks.push({
      inicio: formatHHMM(start),
      fim: formatHHMM(start + take),
    });
    left -= take;
  }
  return blocks;
}

function defaultDayMinutes(settings: PlannerSettings): number {
  try {
    const p1 = parseHHMM(settings.defaultExit) > parseHHMM(settings.defaultEntry);
    if (!p1) return metaDiariaReferencia(settings.weeklyGoalMinutes, parseWorkDays(settings.workDays).length);
    // Aproximação: entrada → saída menos intervalo
    const span =
      parseHHMM(settings.defaultExit) - parseHHMM(settings.defaultEntry);
    return Math.max(0, span - settings.defaultBreakMinutes);
  } catch {
    return 480;
  }
}

export function calcularPlanejamentoSemanal(input: {
  settings: PlannerSettings;
  entries: PlannerEntry[];
  classes: PlannerClass[];
  holidays: PlannerHoliday[];
  bankOpeningBalanceMinutes: number;
  /** Saldo de banco antes da semana atual (já calculado) */
  bankPreviousMinutes: number;
  referenceDate: string;
  weekStart?: string;
}): PlanejamentoSemanal {
  const { settings, entries, classes, holidays, bankPreviousMinutes, referenceDate } =
    input;
  const workDays = parseWorkDays(settings.workDays);
  const weekStart = input.weekStart ?? getWeekStart(referenceDate);
  const weekDates = getWeekDates(weekStart, workDays);
  const holidaySet = new Set(holidays.map((h) => h.date));

  const workedByDate = new Map(entries.map((e) => [e.date, e.workedMinutes]));
  const trabalhadoMinutos = weekDates.reduce(
    (s, d) => s + (workedByDate.get(d) ?? 0),
    0
  );
  const metaMinutos = settings.weeklyGoalMinutes;
  const restanteMinutos = Math.max(0, metaMinutos - trabalhadoMinutos);
  const saldoMinutos = trabalhadoMinutos - metaMinutos;

  const diasDisponiveis = weekDates.filter((d) => {
    if (holidaySet.has(d)) return false;
    if (compareDate(d, referenceDate) < 0) return false;
    if (compareDate(d, referenceDate) === 0 && workedByDate.has(d)) return false;
    if (compareDate(d, referenceDate) > 0 && workedByDate.has(d)) return false;
    return true;
  });

  const periodosDisponiveisPorDia: Record<string, TimeBlock[]> = {};
  const capacities: number[] = [];
  const dayMeta: Array<{
    date: string;
    workPeriods: TimeBlock[];
    aulas: ReturnType<typeof classesForDate>;
  }> = [];

  for (const d of diasDisponiveis) {
    const { workPeriods, aulas } = availablePeriodsForDay(d, settings, classes);
    periodosDisponiveisPorDia[d] = workPeriods;
    capacities.push(dayCapacity(workPeriods, settings.maxDailyMinutes));
    dayMeta.push({ date: d, workPeriods, aulas });
  }

  const capacidadeTotalMinutos = capacities.reduce((a, b) => a + b, 0);
  const padrao = defaultDayMinutes(settings);

  if (!settings.allowCompensation) {
    return {
      weekStart,
      trabalhadoMinutos,
      restanteMinutos,
      saldoMinutos,
      bancoAnterior: bankPreviousMinutes,
      bancoProjetado: bankPreviousMinutes + saldoMinutos,
      diasDisponiveis,
      periodosDisponiveisPorDia,
      sugestoes: [],
      previsaoFechamentoMinutos: trabalhadoMinutos,
      viavel: restanteMinutos === 0,
      alerta:
        restanteMinutos > 0
          ? `Faltam ${formatMinutesLong(restanteMinutos)} para a meta. Compensação desabilitada nas configurações.`
          : undefined,
      metaMinutos,
      capacidadeTotalMinutos,
    };
  }

  if (restanteMinutos === 0) {
    return {
      weekStart,
      trabalhadoMinutos,
      restanteMinutos: 0,
      saldoMinutos,
      bancoAnterior: bankPreviousMinutes,
      bancoProjetado: bankPreviousMinutes + saldoMinutos,
      diasDisponiveis,
      periodosDisponiveisPorDia,
      sugestoes: [],
      previsaoFechamentoMinutos: trabalhadoMinutos,
      viavel: true,
      alerta: "Você já atingiu a meta semanal.",
      metaMinutos,
      capacidadeTotalMinutos,
    };
  }

  if (diasDisponiveis.length === 0) {
    return {
      weekStart,
      trabalhadoMinutos,
      restanteMinutos,
      saldoMinutos,
      bancoAnterior: bankPreviousMinutes,
      bancoProjetado: bankPreviousMinutes + saldoMinutos,
      diasDisponiveis,
      periodosDisponiveisPorDia,
      sugestoes: [],
      previsaoFechamentoMinutos: trabalhadoMinutos,
      viavel: false,
      alerta: `Não há dias úteis restantes. Faltam ${formatMinutesLong(restanteMinutos)} e não é possível compensar nesta semana.`,
      metaMinutos,
      capacidadeTotalMinutos,
    };
  }

  const { allocations, feasible } = distributeMinutes(
    restanteMinutos,
    capacities
  );

  const sugestoes: DaySuggestion[] = dayMeta.map((meta, i) => {
    const minutos = allocations[i];
    const blocos = allocateBlocks(meta.workPeriods, minutos);
    return {
      data: meta.date,
      weekdayName: WEEKDAY_NAMES[getIsoWeekday(meta.date)] ?? meta.date,
      blocos,
      minutos,
      deltaVsPadrao: minutos - padrao,
      aulas: meta.aulas,
    };
  }).filter((s) => s.minutos > 0);

  const previstoExtra = allocations.reduce((a, b) => a + b, 0);
  const previsaoFechamentoMinutos = trabalhadoMinutos + previstoExtra;

  let alerta: string | undefined;
  let viavel = feasible;

  if (!feasible) {
    viavel = false;
    const maxNeeded =
      diasDisponiveis.length > 0
        ? Math.ceil(restanteMinutos / diasDisponiveis.length)
        : restanteMinutos;
    alerta =
      `Não é possível cumprir a meta de maneira razoável. ` +
      `Faltam ${formatMinutesLong(restanteMinutos)}, capacidade disponível ${formatMinutesLong(capacidadeTotalMinutos)} ` +
      `(limite ${formatMinutesLong(settings.maxDailyMinutes)}/dia). ` +
      `Seriam necessárias cerca de ${formatMinutesLong(maxNeeded)} por dia restante. ` +
      `Sugestão parcial abaixo cobre o máximo viável.`;
  } else if (
    allocations.some((a) => a > settings.maxDailyMinutes * 0.9) &&
    restanteMinutos > padrao * diasDisponiveis.length
  ) {
    alerta =
      "Atenção: a compensação necessária está elevada em relação à jornada padrão.";
  }

  return {
    weekStart,
    trabalhadoMinutos,
    restanteMinutos,
    saldoMinutos,
    bancoAnterior: bankPreviousMinutes,
    bancoProjetado: bankPreviousMinutes + (previsaoFechamentoMinutos - metaMinutos),
    diasDisponiveis,
    periodosDisponiveisPorDia,
    sugestoes,
    previsaoFechamentoMinutos,
    viavel,
    alerta,
    metaMinutos,
    capacidadeTotalMinutos,
  };
}

/** Utilitário para sugestão simples sem aulas (usa defaults). */
export function suggestionFromDefaults(
  date: string,
  minutes: number,
  settings: PlannerSettings
): DaySuggestion {
  const breakMin = settings.defaultBreakMinutes;
  const entry = settings.defaultEntry;
  // total trabalho = (breakStart-entry) + (exit-breakEnd)
  // com intervalo fixo: span = minutes + break
  const span = minutes + breakMin;
  const exit = addMinutesToHHMM(entry, span);
  const breakStart = addMinutesToHHMM(
    entry,
    Math.floor(minutes / 2)
  );
  const breakEnd = addMinutesToHHMM(breakStart, breakMin);

  return {
    data: date,
    weekdayName: WEEKDAY_NAMES[getIsoWeekday(date)] ?? date,
    blocos: [
      { inicio: entry, fim: breakStart },
      { inicio: breakEnd, fim: exit },
    ],
    minutos: minutes,
    deltaVsPadrao: minutes - defaultDayMinutes(settings),
    aulas: [],
  };
}
