import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUserId } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await ctx.params;
    const existing = await prisma.holiday.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }
    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
