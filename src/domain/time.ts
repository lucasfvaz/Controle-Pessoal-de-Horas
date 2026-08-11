/** Representação interna de tempo em minutos desde 00:00. */

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseHHMM(value: string): number {
  const match = HHMM_RE.exec(value.trim());
  if (!match) {
    throw new Error(`Horário inválido: ${value}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

export function formatHHMM(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes)) {
    throw new Error("Minutos inválidos");
  }
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Formato amigável: 1h40, +2h30, -0h45, 0h */
export function formatMinutes(totalMinutes: number, withSign = false): string {
  const sign = totalMinutes > 0 ? "+" : totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const body = m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
  if (withSign && totalMinutes !== 0) return `${sign}${body}`;
  if (withSign && totalMinutes === 0) return "0h";
  return body;
}

export function formatMinutesLong(totalMinutes: number, withSign = false): string {
  const sign = totalMinutes > 0 ? "+" : totalMinutes < 0 ? "-" : "";
  const abs = Math.abs(Math.round(totalMinutes));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const body = `${h}h${String(m).padStart(2, "0")}`;
  if (withSign && totalMinutes !== 0) return `${sign}${body}`;
  if (withSign && totalMinutes === 0) return "0h00";
  return body;
}

export function diffMinutes(start: string, end: string): number {
  const a = parseHHMM(start);
  const b = parseHHMM(end);
  if (b < a) {
    throw new Error(`Intervalo inválido: ${start} → ${end}`);
  }
  return b - a;
}

export function isValidHHMM(value: string): boolean {
  return HHMM_RE.test(value.trim());
}

export function addMinutesToHHMM(time: string, minutes: number): string {
  return formatHHMM(parseHHMM(time) + minutes);
}

export function clampMinutes(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Segunda-feira da semana ISO local a partir de YYYY-MM-DD */
export function getWeekStart(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  const day = d.getUTCDay(); // 0=dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return toDateOnly(d);
}

export function getWeekEnd(weekStart: string): string {
  const d = parseDateOnly(weekStart);
  d.setUTCDate(d.getUTCDate() + 4); // sexta (seg+4) — dias úteis padrão
  return toDateOnly(d);
}

export function getWeekDates(weekStart: string, workDays: number[]): string[] {
  const start = parseDateOnly(weekStart);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const weekday = d.getUTCDay(); // 0=dom
    const isoWeekday = weekday === 0 ? 7 : weekday; // 1=seg … 7=dom
    if (workDays.includes(isoWeekday)) {
      dates.push(toDateOnly(d));
    }
  }
  return dates;
}

export function parseWorkDays(workDays: string): number[] {
  return workDays
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => n >= 1 && n <= 7);
}

export function getIsoWeekday(dateStr: string): number {
  const d = parseDateOnly(dateStr);
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

export function parseDateOnly(dateStr: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error(`Data inválida: ${dateStr}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function toDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

export function todayDateOnly(timeZone = "America/Sao_Paulo"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export const WEEKDAY_NAMES: Record<number, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
  7: "Domingo",
};

export function compareDate(a: string, b: string): number {
  return a.localeCompare(b);
}
