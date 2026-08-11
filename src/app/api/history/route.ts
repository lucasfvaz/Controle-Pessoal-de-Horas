import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUserId } from "@/lib/session";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const balance = searchParams.get("balance"); // positive | negative | all

    const where: {
      userId: string;
      date?: { gte?: string; lte?: string };
      dayBalanceMinutes?: { gt?: number; lt?: number };
    } = { userId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    if (balance === "positive") {
      where.dayBalanceMinutes = { gt: 0 };
    } else if (balance === "negative") {
      where.dayBalanceMinutes = { lt: 0 };
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
