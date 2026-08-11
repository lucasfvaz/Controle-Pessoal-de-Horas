import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUserId } from "@/lib/session";
import { classSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = classSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const existing = await prisma.classSchedule.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    const updated = await prisma.classSchedule.update({
      where: { id },
      data: { ...parsed.data, notes: parsed.data.notes ?? null },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const existing = await prisma.classSchedule.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    await prisma.classSchedule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
