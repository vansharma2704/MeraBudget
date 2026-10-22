-- Keywords tagged on transactions (e.g. from bank statement import). Additive only.
ALTER TABLE "transactions" ADD COLUMN "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
