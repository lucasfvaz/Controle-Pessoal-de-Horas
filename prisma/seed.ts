import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@gestor.local";
  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrador",
      passwordHash,
      settings: {
        create: {
          weeklyGoalMinutes: 2400,
          workDays: "1,2,3,4,5",
          defaultEntry: "08:00",
          defaultExit: "17:30",
          defaultBreakMinutes: 60,
          allowCompensation: true,
          maxDailyMinutes: 600,
          suggestionWindowStart: "07:00",
          suggestionWindowEnd: "20:00",
          bankOpeningBalanceMinutes: 0,
        },
      },
    },
  });

  console.log("Seed OK:", user.email, "(senha: admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
