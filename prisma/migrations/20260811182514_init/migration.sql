-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weeklyGoalMinutes" INTEGER NOT NULL DEFAULT 2400,
    "workDays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "defaultEntry" TEXT NOT NULL DEFAULT '08:00',
    "defaultExit" TEXT NOT NULL DEFAULT '17:30',
    "defaultBreakMinutes" INTEGER NOT NULL DEFAULT 60,
    "allowCompensation" BOOLEAN NOT NULL DEFAULT true,
    "maxDailyMinutes" INTEGER NOT NULL DEFAULT 600,
    "suggestionWindowStart" TEXT NOT NULL DEFAULT '07:00',
    "suggestionWindowEnd" TEXT NOT NULL DEFAULT '20:00',
    "bankOpeningBalanceMinutes" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "entryTime" TEXT NOT NULL,
    "breakStart" TEXT NOT NULL,
    "breakEnd" TEXT NOT NULL,
    "exitTime" TEXT NOT NULL,
    "notes" TEXT,
    "workedMinutes" INTEGER NOT NULL,
    "dayBalanceMinutes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "ClassSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'holiday',
    CONSTRAINT "Holiday_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeEntryAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timeEntryId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeEntryAudit_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeEntryAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_date_idx" ON "TimeEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_userId_date_key" ON "TimeEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "ClassSchedule_userId_weekday_idx" ON "ClassSchedule"("userId", "weekday");

-- CreateIndex
CREATE INDEX "Holiday_userId_date_idx" ON "Holiday"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_userId_date_key" ON "Holiday"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeEntryAudit_userId_createdAt_idx" ON "TimeEntryAudit"("userId", "createdAt");
