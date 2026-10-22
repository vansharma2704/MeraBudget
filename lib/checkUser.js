import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";
import { getDbUser } from "./getDbUser";

export const checkUser = async () => {
  try {
    // Attempt to find existing user — if DB is unreachable, return null gracefully
    let loggedInUser = null;
    try {
      loggedInUser = await getDbUser();
    } catch (fetchErr) {
      // Log carefully but ensure we don't crash
      console.error("Database connection issue in checkUser:", fetchErr.message);
      return null;
    }

    if (loggedInUser) return loggedInUser;

    // Only new (or signed-out) users reach Clerk's API
    const user = await currentUser();
    if (!user) return null;

    // User doesn't exist yet — create them
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    try {
      const newUser = await db.user.create({
        data: {
          clerkUserid: user.id,
          name: name || "User",
          imageUrl: user.imageUrl,
          email: user.emailAddresses[0]?.emailAddress,
        },
      });
      return newUser;
    } catch (createErr) {
      // Handle race condition: another request may have created the user already
      if (createErr.code === "P2002") {
        // Unique constraint violation — fetch the already-created user
        return db.user.findUnique({ where: { clerkUserid: user.id } }).catch(() => null);
      }
      console.error("DB create failed in checkUser:", createErr.message);
      return null;
    }
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    console.error("checkUser Error:", error.message);
    return null;
  }
};