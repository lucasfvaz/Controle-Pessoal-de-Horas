import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) {
    throw new AuthError("Não autenticado");
  }
  return id;
}

export class AuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getUserSettings(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });
  if (!settings) {
    return prisma.userSettings.create({
      data: { userId },
    });
  }
  return settings;
}
