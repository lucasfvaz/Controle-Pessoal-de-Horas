import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { calcularPlanejamentoSemanal } from "@/domain/planner";
import { calcularBancoHoras } from "@/domain/bank";
import { getWeekStart, parseWorkDays, todayDateOnly } from "@/domain/time";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get("week");
    const referenceDate = todayDateOnly();
    const weekStart = weekParam
      ? getWeekStart(weekParam)
      : getWeekStart(referenceDate);

    const settings = await getUserSettings(userId);
    const workDays = parseWorkDays(settings.workDays);

    const [entries, classes, holidays, allEntries] = await Promise.all([
      prisma.timeEntry.findMany({
        where: {
          userId,
          date: {
            gte: weekStart,
            lte: (() => {
              const d = new Date(weekStart + "T00:00:00Z");
              d.setUTCDate(d.getUTCDate() + 6);
              return d.toISOString().slice(0, 10);
            })(),
          },
        },
      }),
      prisma.classSchedule.findMany({ where: { userId } }),
      prisma.holiday.findMany({
        where: {
          userId,
          date: {
            gte: weekStart,
            lte: (() => {
              const d = new Date(weekStart + "T00:00:00Z");
              d.setUTCDate(d.getUTCDate() + 6);
              return d.toISOString().slice(0, 10);
            })(),
          },
        },
      }),
      prisma.timeEntry.findMany({
        where: { userId },
        select: { date: true, workedMinutes: true },
      }),
    ]);

    const bank = calcularBancoHoras({
      openingBalanceMinutes: settings.bankOpeningBalanceMinutes,
      entries: allEntries,
      weeklyGoalMinutes: settings.weeklyGoalMinutes,
      workDaysCount: workDays.length,
      weekStart,
    });

    const planning = calcularPlanejamentoSemanal({
      settings: {
        weeklyGoalMinutes: settings.weeklyGoalMinutes,
        workDays: settings.workDays,
        defaultEntry: settings.defaultEntry,
        defaultExit: settings.defaultExit,
        defaultBreakMinutes: settings.defaultBreakMinutes,
        allowCompensation: settings.allowCompensation,
        maxDailyMinutes: settings.maxDailyMinutes,
        suggestionWindowStart: settings.suggestionWindowStart,
        suggestionWindowEnd: settings.suggestionWindowEnd,
      },
      entries: entries.map((e) => ({
        date: e.date,
        workedMinutes: e.workedMinutes,
      })),
      classes,
      holidays,
      bankOpeningBalanceMinutes: settings.bankOpeningBalanceMinutes,
      bankPreviousMinutes: bank.saldoAnterior,
      referenceDate,
      weekStart,
    });

    return NextResponse.json({ planning, bank });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
