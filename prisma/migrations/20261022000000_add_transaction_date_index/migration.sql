-- AddIndex
CREATE INDEX IF NOT EXISTS "transactions_userId_date_idx" ON "transactions"("userId", "date" DESC);
