import { z } from "zod";

export const hhmmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (HH:MM)");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD)");

export const punchSchema = z
  .object({
    date: dateSchema,
    entryTime: hhmmSchema,
    breakStart: hhmmSchema,
    breakEnd: hhmmSchema,
    exitTime: hhmmSchema,
    notes: z.string().optional().nullable(),
  })
  .refine(
    (d) =>
      d.entryTime < d.breakStart &&
      d.breakStart <= d.breakEnd &&
      d.breakEnd < d.exitTime,
    {
      message:
        "Ordem inválida: Entrada < Saída intervalo ≤ Retorno < Saída",
    }
  );

export const classSchema = z
  .object({
    name: z.string().min(1, "Nome obrigatório"),
    weekday: z.number().int().min(1).max(7),
    startTime: hhmmSchema,
    endTime: hhmmSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    notes: z.string().optional().nullable(),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "Horário final deve ser após o inicial",
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: "Data final deve ser ≥ data inicial",
  });

export const settingsSchema = z.object({
  weeklyGoalMinutes: z.number().int().min(60).max(7 * 24 * 60),
  workDays: z.string().min(1),
  defaultEntry: hhmmSchema,
  defaultExit: hhmmSchema,
  defaultBreakMinutes: z.number().int().min(0).max(240),
  allowCompensation: z.boolean(),
  maxDailyMinutes: z.number().int().min(60).max(24 * 60),
  suggestionWindowStart: hhmmSchema,
  suggestionWindowEnd: hhmmSchema,
  bankOpeningBalanceMinutes: z.number().int(),
});

export const holidaySchema = z.object({
  date: dateSchema,
  name: z.string().min(1),
  type: z.enum(["holiday", "vacation", "day_off", "leave"]).default("holiday"),
});
