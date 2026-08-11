import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { calcularBancoHoras, evolucaoBanco } from "@/domain/bank";
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
    const allEntries = await prisma.timeEntry.findMany({
      where: { userId },
      select: { date: true, workedMinutes: true },
      orderBy: { date: "asc" },
    });

    const bank = calcularBancoHoras({
      openingBalanceMinutes: settings.bankOpeningBalanceMinutes,
      entries: allEntries,
      weeklyGoalMinutes: settings.weeklyGoalMinutes,
      workDaysCount: workDays.length,
      weekStart,
    });

    const history = evolucaoBanco({
      openingBalanceMinutes: settings.bankOpeningBalanceMinutes,
      entries: allEntries,
      weeklyGoalMinutes: settings.weeklyGoalMinutes,
      workDaysCount: workDays.length,
    });

    return NextResponse.json({ bank, history, weekStart });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
