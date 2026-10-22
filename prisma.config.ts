import { defineConfig } from "@prisma/config";
import "dotenv/config";

// Prisma 7 removed `directUrl`. The CLI (migrate, db push) uses this URL, so
// prefer the direct connection; the app itself connects via DATABASE_URL in lib/prisma.js.
export default defineConfig({
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
