import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, requireUserId } from "@/lib/session";
import { classSchema } from "@/lib/validators";

export async function GET() {
  try {
    const userId = await requireUserId();
    const classes = await prisma.classSchedule.findMany({
      where: { userId },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    });
    return NextResponse.json(classes);
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
    const parsed = classSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const item = await prisma.classSchedule.create({
      data: { userId, ...parsed.data, notes: parsed.data.notes ?? null },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
