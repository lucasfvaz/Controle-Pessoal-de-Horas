import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { calcularResumoSemana } from "@/domain/journey";
import { calcularBancoHoras, evolucaoBanco } from "@/domain/bank";
import { calcularPlanejamentoSemanal } from "@/domain/planner";
import { gerarAlertas } from "@/domain/alerts";
import {
  getWeekStart,
  parseWorkDays,
  todayDateOnly,
} from "@/domain/time";

export async function GET() {
  try {
    const userId = await requireUserId();
    const settings = await getUserSettings(userId);
    const referenceDate = todayDateOnly();
    const weekStart = getWeekStart(referenceDate);
    const workDays = parseWorkDays(settings.workDays);

    const weekEndDate = new Date(weekStart + "T00:00:00Z");
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const weekEnd = weekEndDate.toISOString().slice(0, 10);

    const [weekEntries, allEntries, classes, holidays] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
        orderBy: { date: "asc" },
      }),
      prisma.timeEntry.findMany({
        where: { userId },
        select: { date: true, workedMinutes: true },
        orderBy: { date: "asc" },
      }),
      prisma.classSchedule.findMany({ where: { userId } }),
      prisma.holiday.findMany({
        where: { userId, date: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

    const resumo = calcularResumoSemana(weekEntries, settings, weekStart);
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
      entries: weekEntries.map((e) => ({
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

    const alerts = gerarAlertas({
      metaMinutos: resumo.metaMinutos,
      trabalhadoMinutos: resumo.trabalhadoMinutos,
      faltaMinutos: resumo.faltaMinutos,
      saldoMinutos: resumo.saldoMinutos,
      bancoAtual: bank.saldoAtual,
      diasRestantes: planning.diasDisponiveis.length,
      maxDailyMinutes: settings.maxDailyMinutes,
      viavel: planning.viavel,
      plannerAlerta: planning.alerta,
    });

    const chartWeek = resumo.porDia.map((d) => ({
      name: d.weekdayName.slice(0, 3),
      meta: d.dailyGoalMinutes,
      trabalhado: d.workedMinutes,
    }));

    const bankHistory = evolucaoBanco({
      openingBalanceMinutes: settings.bankOpeningBalanceMinutes,
      entries: allEntries,
      weeklyGoalMinutes: settings.weeklyGoalMinutes,
      workDaysCount: workDays.length,
    }).slice(-30);

    return NextResponse.json({
      resumo,
      bank,
      planning,
      alerts,
      charts: {
        week: chartWeek,
        bankHistory,
      },
      settings: {
        weeklyGoalMinutes: settings.weeklyGoalMinutes,
        allowCompensation: settings.allowCompensation,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
