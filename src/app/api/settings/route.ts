import { NextResponse } from "next/server";
import { AuthError, getUserSettings, requireUserId } from "@/lib/session";
import { settingsSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const settings = await getUserSettings(userId);
    return NextResponse.json(settings);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...parsed.data },
      update: parsed.data,
    });
    return NextResponse.json(settings);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
}
