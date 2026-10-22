"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { firstRecurrence } from "@/lib/recurring";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";





const serializeAmount = (obj) => ({
  ...obj,
  
  amount: obj.amount.toNumber(),
  
 
  date: obj.date.toISOString(),
  createdAt: obj.createdAt.toISOString(), 
  updatedAt: obj.updatedAt.toISOString(), 


  nextRecurringDate: obj.nextRecurringDate
    ? obj.nextRecurringDate.toISOString()
    : null,
});

export async function createTransaction(data){
 try { 
    const {userId} = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Arcjet rate limiting is a remote call; only enforce it in production
    if (process.env.NODE_ENV === "production") {
      const req = await request();
      const decision = await aj.protect(req,{
          userId,
          requested: 1,
      });

      if(decision.isDenied()){
          if(decision.reason.isRateLimit()){
              const {remaining, reset} = decision.reason;
              console.error({
                  code: "RATE_LIMIT_EXCEEDED",
                  details: {
                      remaining,
                      resetInSeconds: reset,
                  },
              });

              throw new Error("Too many requests. Please try again later.");
          }
              throw new Error("Request Blocked");
      }
    }

    const amount = Number(data.amount);
    const date = new Date(data.date);
    if (!["INCOME", "EXPENSE"].includes(data.type)) throw new Error("Invalid transaction type");
    if (!(amount > 0)) throw new Error("Amount must be more than 0");
    if (Number.isNaN(date.getTime())) throw new Error("Invalid date");

    const interval = data.isRecurring ? data.recurringInterval || null : null;
    const nextRecurringDate = interval ? firstRecurrence(date, interval) : null;
    const balanceChange = data.type === "EXPENSE" ? -amount : amount;

    // One round trip (the DB is ~400ms away): a single statement that checks the account belongs to
    // this user, adjusts its balance and inserts the transaction — atomic because it's one statement.
    // Dates are stored as UTC in "timestamp without time zone" columns, matching what Prisma writes.
    const rows = await db.$queryRaw`
      WITH acct AS (
        UPDATE accounts a
        SET balance = a.balance + ${balanceChange}::numeric, "updatedAt" = (now() AT TIME ZONE 'UTC')
        FROM users u
        WHERE a.id = ${data.accountId} AND a."userId" = u.id AND u."clerkUserid" = ${userId}
        RETURNING a.id, a."userId"
      )
      INSERT INTO transactions
        (id, type, amount, description, date, category, "isRecurring", "recurringInterval", "nextRecurringDate", "userId", "accountId", "updatedAt")
      SELECT
        gen_random_uuid()::text,
        ${data.type}::"TransactionType",
        ${amount}::numeric,
        ${data.description || null},
        (${date.toISOString()}::timestamptz AT TIME ZONE 'UTC'),
        ${data.category},
        ${Boolean(data.isRecurring)},
        ${interval}::"RecurringInterval",
        (${nextRecurringDate ? nextRecurringDate.toISOString() : null}::timestamptz AT TIME ZONE 'UTC'),
        acct."userId",
        acct.id,
        (now() AT TIME ZONE 'UTC')
      FROM acct
      RETURNING id, "accountId", type, category, description, "isRecurring"
    `;

    const created = rows[0];
    if (!created) throw new Error("Account not found");

    revalidatePath("/dashboard");
    revalidatePath(`/account/${created.accountId}`);

    return {
      success: true,
      data: {
        ...created,
        amount,
        date: date.toISOString(),
        nextRecurringDate: nextRecurringDate ? nextRecurringDate.toISOString() : null,
      },
    };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return {success:false,message:error.message};
  }
}



export async function getTransaction(id) {
  try {
    const user = await getDbUser();

    if (!user) throw new Error("User not found");

    const transaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!transaction) throw new Error("Transaction not found");

    return serializeAmount(transaction);
  } catch (error) {
    console.error("DB Error in getTransaction:", error.message);
    throw error; // Re-throw for parent handler or return null/empty
  }
}

// REPLACE your old function with this one
export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: userId },
    });

    if (!user) throw new Error("User not found");

    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Only accept known fields — never spread client input into the update (it could set userId etc.)
    const amount = Number(data.amount);
    const date = new Date(data.date);
    if (!["INCOME", "EXPENSE"].includes(data.type)) throw new Error("Invalid transaction type");
    if (!(amount > 0)) throw new Error("Amount must be more than 0");
    if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
    const interval = data.isRecurring ? data.recurringInterval || null : null;

    // The (possibly new) account must belong to this user
    const targetAccount = await db.account.findFirst({
      where: { id: data.accountId, userId: user.id },
      select: { id: true },
    });
    if (!targetAccount) throw new Error("Account not found");

    // --- START OF NEW BALANCE LOGIC ---

    // 1. Calculate the old and new balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -amount : amount;

    // 2. Start the database transaction
    const transaction = await db.$transaction(async (tx) => {
      // 3. Update the transaction itself
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          type: data.type,
          amount,
          description: data.description || null,
          date,
          category: data.category,
          accountId: targetAccount.id,
          isRecurring: Boolean(data.isRecurring),
          recurringInterval: interval,
          nextRecurringDate: interval ? firstRecurrence(date, interval) : null,
        },
      });

      // 4. Check if the account was changed
      if (originalTransaction.accountId === data.accountId) {
        // --- Case 1: Account is THE SAME ---
        // We only need to apply the net difference
        const netBalanceChange = newBalanceChange - oldBalanceChange;
        await tx.account.update({
          where: { id: targetAccount.id, userId: user.id },
          data: {
            balance: {
              increment: netBalanceChange,
            },
          },
        });
      } else {
        // --- Case 2: Account was CHANGED ---
        // Revert the old transaction from the old account
        await tx.account.update({
          where: { id: originalTransaction.accountId, userId: user.id },
          data: {
            balance: {
              increment: -oldBalanceChange, // Revert the old amount
            },
          },
        });

        // Apply the new transaction to the new account
        await tx.account.update({
          where: { id: targetAccount.id, userId: user.id },
          data: {
            balance: {
              increment: newBalanceChange, // Apply the new amount
            },
          },
        });
      }
      // --- END OF NEW BALANCE LOGIC ---

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);
    
    // This now correctly revalidates the old account page if it changed
    if (originalTransaction.accountId !== data.accountId) {
      revalidatePath(`/account/${originalTransaction.accountId}`);
    }

    // FIX: Changed "sucess" to "success"
    return { success: true, data:{accountId: transaction.accountId}  };

  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    // FIX: Return an object instead of throwing
    return { success: false, message: error.message };
  }
}