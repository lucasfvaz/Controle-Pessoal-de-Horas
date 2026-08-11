import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUserId } from "@/lib/session";
import { holidaySchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const where: {
      userId: string;
      date?: { gte?: string; lte?: string };
    } = { userId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }
    const items = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return NextResponse.json(items);
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
    const parsed = holidaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const item = await prisma.holiday.create({
      data: { userId, ...parsed.data },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
