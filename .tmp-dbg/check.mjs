import { readFileSync } from "node:fs";
import { parseStatementLines } from "./parse.mjs";
import { categorize } from "./categorize.mjs";
const types = { salary:"INCOME", investments:"INCOME", "other-income":"INCOME", bills:"EXPENSE", shopping:"EXPENSE", food:"EXPENSE", "other-expense":"EXPENSE" };
const lines = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { rows, openingBalance } = parseStatementLines(lines);
console.log("opening:", openingBalance, "| rows:", rows.length);
let inc = 0, exp = 0;
for (const r of rows) { const c = categorize(r, types); r.type === "INCOME" ? inc += r.amount : exp += r.amount;
  console.log(" ", r.date.slice(0,10), r.type.padEnd(7), String(r.amount).padStart(7), String(r.balance).padStart(8), c.category.padEnd(13), c.description.slice(0,28).padEnd(28), "[" + c.keywords.join(", ") + "]"); }
console.log("income", inc.toFixed(2), "| expenses", exp.toFixed(2), "| opening + income - expenses =", (openingBalance + inc - exp).toFixed(2));
