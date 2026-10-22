import assert from "node:assert/strict";
import { parseStatementLines } from "./parse.mjs";
import { categorize } from "./categorize.mjs";
const types = { salary:"INCOME", freelance:"INCOME", investments:"INCOME", business:"INCOME", rental:"INCOME", "other-income":"INCOME",
  housing:"EXPENSE", transportation:"EXPENSE", groceries:"EXPENSE", utilities:"EXPENSE", entertainment:"EXPENSE", food:"EXPENSE", shopping:"EXPENSE",
  healthcare:"EXPENSE", education:"EXPENSE", personal:"EXPENSE", travel:"EXPENSE", insurance:"EXPENSE", gifts:"EXPENSE", bills:"EXPENSE", "other-expense":"EXPENSE" };
const show = (rows) => rows.map((r) => { const c = categorize(r, types); return `${r.date.slice(0,10)} ${r.type.padEnd(7)} ${String(r.amount).padStart(9)} ${c.category.padEnd(14)} ${c.description.padEnd(18)} [${c.keywords.join(", ")}]`; }).join("\n");

// HDFC-like: Date | Narration | Ref | Value Dt | Withdrawal | Deposit | Closing balance (only one of W/D printed)
const hdfc = parseStatementLines([
  "HDFC BANK  Statement of account",
  "Date  Narration  Chq./Ref.No.  Value Dt  Withdrawal Amt.  Deposit Amt.  Closing Balance",
  "Opening Balance  10,000.00",
  "01/04/24  UPI-SWIGGY-swiggy@icici-ICIC0000001-409112345678-Order  0000409112345678  01/04/24  250.00  9,750.00",
  "02/04/24  NEFT CR-ACME TECHNOLOGIES PVT LTD-SALARY APR  N091241234567  02/04/24  50,000.00  59,750.00",
  "03/04/24  POS 4567XXXXXX1234 AMAZON PAY INDIA  0000312345  03/04/24  1,299.00  58,451.00",
  "05/04/24  UPI-RAHUL SHARMA-rahul@okaxis-UTIB0000",
  "  -409512345678-dinner split  0000409512345678  05/04/24  600.00  59,051.00",
  "06/04/24  ACH D- HDFC LTD-EMI 123456789  0000123456789  06/04/24  12,500.00  46,551.00",
  "Page 1 of 2",
]);
console.log("— HDFC style\n" + show(hdfc.rows));
assert.equal(hdfc.rows.length, 5);
assert.deepEqual(hdfc.rows.map((r) => r.type), ["EXPENSE", "INCOME", "EXPENSE", "INCOME", "EXPENSE"]);
assert.deepEqual(hdfc.rows.map((r) => r.amount), [250, 50000, 1299, 600, 12500]);

// SBI-like: Txn Date | Value Date | Description | Ref | Debit | Credit | Balance, with named months, newest first
const sbi = parseStatementLines([
  "Txn Date  Value Date  Description  Ref No./Cheque No.  Debit  Credit  Balance",
  "10 Apr 2024  10 Apr 2024  TO TRANSFER-UPI/DR/410012345678/ZOMATO/YESB/zomato@ybl  410012345678  450.00    24,550.00",
  "08 Apr 2024  08 Apr 2024  BY TRANSFER-UPI/CR/409812345678/PRIYA/SBIN/priya@sbi  409812345678    5,000.00  25,000.00",
  "07 Apr 2024  07 Apr 2024  ATM WDL-ATM CASH 1234 MG ROAD  1234  2,000.00    20,000.00",
]);
console.log("— SBI style (newest first)\n" + show(sbi.rows));
assert.deepEqual(sbi.rows.map((r) => r.type), ["EXPENSE", "INCOME", "EXPENSE"]);

// ICICI-like with explicit zero columns + Cr/Dr balance style
const icici = parseStatementLines([
  "S No.  Value Date  Transaction Date  Cheque Number  Transaction Remarks  Withdrawal Amount (INR )  Deposit Amount (INR )  Balance (INR )",
  "1  01/05/2024  01/05/2024  -  UPI/412112345678/NETFLIX/netflix@hdfc/Payment  649.00  0.00  30,351.00",
  "2  02/05/2024  02/05/2024  -  INT.PD:01-04-2024 TO 30-04-2024  0.00  120.50  30,471.50",
  "3  03-May-24  03-May-24  -  BIL/ONL/0012345/BESCOM ELECTRICITY  1,240.00  0.00  29,231.50",
]);
console.log("— ICICI style\n" + show(icici.rows));
assert.deepEqual(icici.rows.map((r) => r.type), ["EXPENSE", "INCOME", "EXPENSE"]);
assert.equal(categorize(icici.rows[0], types).category, "entertainment");
assert.equal(categorize(icici.rows[2], types).category, "utilities");
assert.equal(categorize(hdfc.rows[1], types).category, "salary");
assert.equal(categorize(hdfc.rows[0], types).category, "food");
assert.equal(categorize(hdfc.rows[4], types).category, "bills");
console.log("\nall statement tests passed");
