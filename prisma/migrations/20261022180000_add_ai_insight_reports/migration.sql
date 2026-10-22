CREATE TABLE "ai_insight_reports" (
  "id" TEXT NOT NULL,
  "report" JSONB NOT NULL,
  "source" TEXT NOT NULL,
  "model" TEXT,
  "transactionCount" INTEGER NOT NULL DEFAULT 0,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_insight_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_insight_reports_userId_createdAt_idx" ON "ai_insight_reports"("userId", "createdAt");

ALTER TABLE "ai_insight_reports"
ADD CONSTRAINT "ai_insight_reports_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
