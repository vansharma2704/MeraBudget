-- Link a paid bill record to the account and expense transaction it creates.
ALTER TABLE "bill_reminders"
ADD COLUMN "category" TEXT,
ADD COLUMN "accountId" TEXT,
ADD COLUMN "transactionId" TEXT;

CREATE UNIQUE INDEX "bill_reminders_transactionId_key" ON "bill_reminders"("transactionId");
CREATE INDEX "bill_reminders_accountId_idx" ON "bill_reminders"("accountId");

ALTER TABLE "bill_reminders"
ADD CONSTRAINT "bill_reminders_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bill_reminders"
ADD CONSTRAINT "bill_reminders_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
