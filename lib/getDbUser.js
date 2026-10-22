import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "./prisma";

// One user lookup per request, shared by every server action/component that needs it.
// The database is far away (~400ms per round trip), so repeated lookups add up fast.
export const getDbUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  return db.user.findUnique({ where: { clerkUserid: userId } });
});
