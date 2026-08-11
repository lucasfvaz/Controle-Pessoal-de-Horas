import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { classesForDate } from "@/domain/planner";
import { metaDiariaReferencia } from "@/domain/journey";
import { parseWorkDays } from "@/domain/time";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Parâmetro month=YYYY-MM obrigatório" },
        { status: 400 }
      );
    }

    const [y, m] = month.split("-").map(Number);
    const start = `${month}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const end = `${month}-${String(lastDay).padStart(2, "0")}`;

    const settings = await getUserSettings(userId);
    const dailyGoal = metaDiariaReferencia(
      settings.weeklyGoalMinutes,
      parseWorkDays(settings.workDays).length
    );

    const [entries, classes, holidays] = await Promise.all([
      prisma.timeEntry.findMany({
        where: { userId, date: { gte: start, lte: end } },
      }),
      prisma.classSchedule.findMany({ where: { userId } }),
      prisma.holiday.findMany({
        where: { userId, date: { gte: start, lte: end } },
      }),
    ]);

    const entryMap = new Map(entries.map((e) => [e.date, e]));
    const holidayMap = new Map(holidays.map((h) => [h.date, h]));

    const days = [];
    for (let day = 1; day <= lastDay; day++) {
      const date = `${month}-${String(day).padStart(2, "0")}`;
      const entry = entryMap.get(date);
      const aulas = classesForDate(date, classes);
      const holiday = holidayMap.get(date);

      let status: "done" | "partial" | "below" | "empty" = "empty";
      if (entry) {
        if (entry.workedMinutes >= dailyGoal) status = "done";
        else if (entry.workedMinutes >= dailyGoal * 0.5) status = "partial";
        else status = "below";
      }

      days.push({
        date,
        status,
        hasClass: aulas.length > 0,
        holiday: holiday ?? null,
        entry: entry
          ? {
              id: entry.id,
              entryTime: entry.entryTime,
              breakStart: entry.breakStart,
              breakEnd: entry.breakEnd,
              exitTime: entry.exitTime,
              workedMinutes: entry.workedMinutes,
              dayBalanceMinutes: entry.dayBalanceMinutes,
              notes: entry.notes,
            }
          : null,
        aulas,
        dailyGoal,
      });
    }

    return NextResponse.json({ month, dailyGoal, days });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
