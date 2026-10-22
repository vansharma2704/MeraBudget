CREATE TABLE "payment_reminder_emails" (
  "id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "occurrenceDate" TIMESTAMP(3) NOT NULL,
  "daysBefore" INTEGER NOT NULL,
  "userId" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "payment_reminder_emails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_reminder_emails_kind_referenceId_occurrenceDate_daysBefore_key"
ON "payment_reminder_emails"("kind", "referenceId", "occurrenceDate", "daysBefore");

CREATE INDEX "payment_reminder_emails_userId_sentAt_idx"
ON "payment_reminder_emails"("userId", "sentAt");

ALTER TABLE "payment_reminder_emails"
ADD CONSTRAINT "payment_reminder_emails_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
