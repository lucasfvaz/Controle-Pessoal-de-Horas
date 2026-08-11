import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { punchSchema } from "@/lib/validators";
import { calcularHorasTrabalhadas, calcularSaldoDia, metaDiariaReferencia } from "@/domain/journey";
import { parseWorkDays } from "@/domain/time";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const date = searchParams.get("date");

    const where: {
      userId: string;
      date?: string | { gte?: string; lte?: string };
    } = { userId };

    if (date) {
      where.date = date;
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      orderBy: { date: "desc" },
    });
    return NextResponse.json(entries);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = punchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const settings = await getUserSettings(userId);
    const worked = calcularHorasTrabalhadas(parsed.data);
    const dailyGoal = metaDiariaReferencia(
      settings.weeklyGoalMinutes,
      parseWorkDays(settings.workDays).length
    );
    const dayBalance = calcularSaldoDia(worked.totalMinutos, dailyGoal);

    const existing = await prisma.timeEntry.findUnique({
      where: {
        userId_date: { userId, date: parsed.data.date },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe registro para esta data. Use edição." },
        { status: 409 }
      );
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        date: parsed.data.date,
        entryTime: parsed.data.entryTime,
        breakStart: parsed.data.breakStart,
        breakEnd: parsed.data.breakEnd,
        exitTime: parsed.data.exitTime,
        notes: parsed.data.notes ?? null,
        workedMinutes: worked.totalMinutos,
        dayBalanceMinutes: dayBalance,
      },
    });

    await prisma.timeEntryAudit.create({
      data: {
        timeEntryId: entry.id,
        userId,
        action: "CREATE",
        before: null,
        after: JSON.stringify(entry),
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
