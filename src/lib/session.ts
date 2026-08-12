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
  if (settings) return settings;

  // Sessão antiga após reset do DB: userId do JWT não existe mais.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw new AuthError("Sessão inválida. Faça login novamente.");
  }

  return prisma.userSettings.create({
    data: { userId },
  });
}
