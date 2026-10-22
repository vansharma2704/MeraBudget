-- Reconstructed 2026-10-21 from the live database: this migration was applied from another machine
-- but its folder was never committed. Needed so a fresh database can be built from migrations.
ALTER TABLE "transactions" ALTER COLUMN "isRecurring" SET DEFAULT false;
