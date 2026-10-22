import { sendEmail } from "@/actions/send-email";
import { db } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";
import { processDueRecurring } from "@/lib/recurring-process";

// Daily at 01:00 UTC (6:30 AM IST): create due copies of recurring transactions for every user
export const processRecurringTransactions = inngest.createFunction(
  { id: "process-recurring-transactions", name: "Process Recurring Transactions", triggers: [{ cron: "0 1 * * *" }] },
  async ({ step }) => step.run("process-due", () => processDueRecurring({ limit: 1000 }))
);

const REMINDER_DAYS = new Set([7, 3, 1]);
const DAY_MS = 86_400_000;
const utcDay = (date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
const daysUntil = (date, now) => Math.round((utcDay(date) - utcDay(now)) / DAY_MS);

// Daily at 02:30 UTC (08:00 AM IST). The unique delivery record makes retries idempotent.
export const sendPaymentReminders = inngest.createFunction(
  { id: "send-payment-reminders", name: "Send Payment Reminders", triggers: [{ cron: "30 2 * * *" }] },
  async ({ step }) => step.run("find-and-send-reminders", async () => {
    const now = new Date();
    const end = new Date(utcDay(now) + 8 * DAY_MS - 1);
    const start = new Date(utcDay(now));

    const [subscriptions, recurringTransactions] = await Promise.all([
      db.subscription.findMany({
        where: { nextBilling: { gte: start, lte: end } },
        include: { user: { select: { id: true, name: true, email: true } } },
        take: 1000,
      }),
      db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          nextRecurringDate: { gte: start, lte: end },
        },
        include: { user: { select: { id: true, name: true, email: true } } },
        take: 1000,
      }),
    ]);

    const candidates = [
      ...subscriptions.map((item) => ({
        kind: "SUBSCRIPTION",
        transactionType: null,
        referenceId: item.id,
        name: item.name,
        amount: Number(item.amount),
        paymentDate: item.nextBilling,
        frequency: item.frequency,
        user: item.user,
      })),
      ...recurringTransactions.map((item) => ({
        kind: "RECURRING_TRANSACTION",
        transactionType: item.type,
        referenceId: item.id,
        name: item.description || `${item.type === "INCOME" ? "Income" : "Expense"} transaction`,
        amount: Number(item.amount),
        paymentDate: item.nextRecurringDate,
        frequency: item.recurringInterval,
        user: item.user,
      })),
    ];

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of candidates) {
      const daysBefore = daysUntil(item.paymentDate, now);
      if (!REMINDER_DAYS.has(daysBefore)) continue;

      let delivery;
      try {
        delivery = await db.paymentReminderEmail.create({
          data: {
            kind: item.kind,
            referenceId: item.referenceId,
            occurrenceDate: item.paymentDate,
            daysBefore,
            userId: item.user.id,
          },
        });
      } catch (error) {
        if (error.code === "P2002") { skipped++; continue; }
        throw error;
      }

      const result = await sendEmail({
        to: item.user.email,
        subject: item.kind === "SUBSCRIPTION"
          ? `[Subscription] ${item.name} renews in ${daysBefore} day${daysBefore === 1 ? "" : "s"}`
          : `[Recurring ${item.transactionType === "INCOME" ? "Income" : "Expense"}] ${item.name} is due in ${daysBefore} day${daysBefore === 1 ? "" : "s"}`,
        react: EmailTemplate({
          userName: item.user.name,
          type: "payment-reminder",
          data: {
            kind: item.kind,
            transactionType: item.transactionType,
            name: item.name,
            amount: item.amount,
            paymentDate: item.paymentDate.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long" }),
            daysBefore,
            frequency: item.frequency,
            dashboardUrl: process.env.NEXT_PUBLIC_APP_URL
              ? new URL("/bills", process.env.NEXT_PUBLIC_APP_URL).toString()
              : null,
          },
        }),
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
        await db.paymentReminderEmail.delete({ where: { id: delivery.id } });
      }
    }

    if (failed) throw new Error(`${failed} payment reminder email(s) failed`);
    return { sent, skipped, candidates: candidates.length };
  })
);

// Helper function to check if the last alert was sent in a previous month/year
function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

export const checkBudgetAlert = inngest.createFunction(
  { id: "check-budget-alert", name: "Check Budget Alert", triggers: [{ cron: "0 */6 * * *" }] },
  async ({ step }) => {
    
    // 1. Fetch all budgets with necessary user and default account data
    const budgets = await step.run("fetch-budget", async()=>{
       return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });
  
  for(const budget of budgets){
    const defaultAccount = budget.user.accounts[0];
    if(!defaultAccount) continue; // Skip budgets without a default account

    await step.run(`check-budget-${budget.id}`,async () =>{
     
        // 🔑 FIX: Set startDate to midnight (00:00:00.000) for full month coverage
       const startDate = new Date();
       startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0); 


       // Aggregate all expenses from the start of the current month
       const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            type: "EXPENSE",
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        
        // 🔑 FIX: Ensure budgetAmount is a number for accurate math (Prisma Decimal/String handling)
        const budgetAmount = budget.amount; 
        const budgetAmountNum = (budgetAmount && budgetAmount.toNumber) 
            ? budgetAmount.toNumber() 
            : parseFloat(String(budgetAmount)) || 0;
            
        const percentageUsed = (totalExpenses / budgetAmountNum) * 100;
        
        // --- Debugging Logs ---
        console.log(`[Budget ${budget.id}] Total Expenses: ${totalExpenses}`);
        console.log(`[Budget ${budget.id}] Percentage Used: ${percentageUsed.toFixed(2)}%`);
        // ----------------------

        // 1. Check if the alert threshold is met
        const isOverBudget = percentageUsed >= 80;
        
        // 2. 🔑 FINAL FIX: Check if a new alert is needed by isolating the date conversion
        let needsNewAlert = false;
        
        if (!budget.lastAlertSent) {
            // Case A: First alert ever (lastAlertSent is null)
            needsNewAlert = true;
        } else {
            // Case B: Alert has been sent before, check if it was in a new month
            // We only call new Date() when the value is NOT null, preventing the TypeError.
            const lastAlertDate = new Date(budget.lastAlertSent);
            
            // Check if the resulting date object is valid before continuing
            if (!isNaN(lastAlertDate.getTime())) {
                needsNewAlert = isNewMonth(lastAlertDate, new Date());
            } else {
                // Handle case where date string was corrupted; assume alert is needed.
                console.error(`[Budget ${budget.id}] Corrupted lastAlertSent date found. Forcing alert.`);
                needsNewAlert = true;
            }
        }
        
        // Check the final alert condition
        if (isOverBudget && needsNewAlert) {
          
          console.log(`[Budget ${budget.id}] ALERT CONDITION MET. Updating timestamp.`);

       // send Email
       await sendEmail({
        to:budget.user.email,
        subject: `Budget Alert for ${defaultAccount.name}`,
        react:EmailTemplate({
                userName: budget.user.name,
                type: "budget-alert",
                data: {
                  percentageUsed,
                  budgetAmount: parseInt(budgetAmount).toFixed(1),
                  totalExpenses: parseInt(totalExpenses).toFixed(1),
                  accountName: defaultAccount.name,
                }
        }),
       });  


       // Update last Alert Sent to the current timestamp
          await db.budget.update({
            where: {id: budget.id},
            data: {lastAlertSent: new Date()},
          });
        }
    });
   }
  }
);
