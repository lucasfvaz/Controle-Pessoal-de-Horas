import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { punchSchema } from "@/lib/validators";
import {
  calcularHorasTrabalhadas,
  calcularSaldoDia,
  metaDiariaReferencia,
} from "@/domain/journey";
import { parseWorkDays } from "@/domain/time";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const entry = await prisma.timeEntry.findFirst({
      where: { id, userId },
      include: { audits: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!entry) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    return NextResponse.json(entry);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = punchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.timeEntry.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const conflict = await prisma.timeEntry.findFirst({
      where: {
        userId,
        date: parsed.data.date,
        NOT: { id },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Já existe outro registro nesta data" },
        { status: 409 }
      );
    }

    const settings = await getUserSettings(userId);
    const worked = calcularHorasTrabalhadas(parsed.data);
    const dailyGoal = metaDiariaReferencia(
      settings.weeklyGoalMinutes,
      parseWorkDays(settings.workDays).length
    );
    const dayBalance = calcularSaldoDia(worked.totalMinutos, dailyGoal);

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
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
        timeEntryId: id,
        userId,
        action: "UPDATE",
        before: JSON.stringify(existing),
        after: JSON.stringify(updated),
      },
    });

    return NextResponse.json(updated);
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

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const existing = await prisma.timeEntry.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.timeEntryAudit.create({
      data: {
        timeEntryId: id,
        userId,
        action: "DELETE",
        before: JSON.stringify(existing),
        after: null,
      },
    });

    await prisma.timeEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
