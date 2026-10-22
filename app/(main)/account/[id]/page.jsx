import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import TransactionTable from "../_components/transaction-table";
import { BarLoader } from "react-spinners";
import { AccountChart } from "../_components/account-chart";
import StatementImport from "../_components/statement-import";


export default async function AccountsPage({ params }) {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);
if (!accountData){
  notFound();
}

const {transactions, ...account} = accountData;
  return (
  <div className="space-y-8 px-5 ">
    <div className="flex flex-col sm:flex-row gap-6 mt-8 sm:items-end justify-between border-b border-white/5 pb-8">
      <div>
        <h1 className="text-3xl min-[400px]:text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight capitalize leading-tight break-words">
          {accountData.name}
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 text-xs">
          {account.type.toLowerCase()} account summary
        </p>
      </div>

      <div className="text-left sm:text-right space-y-1">
        <div className="text-3xl sm:text-4xl font-bold text-white">
          ₹{parseFloat(accountData.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-primary font-bold uppercase tracking-widest">
          {accountData._count.transactions} transactions recorded
        </p>
      </div>
    </div>

<StatementImport accountId={id} />

{/*chart Section */}

<Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#e9c46a"/>}>
<AccountChart transactions={transactions} />
</Suspense>

{/* Transaction Table */}
<Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#d4a843"/>}>
  <TransactionTable transactions={transactions}/>
</Suspense>

  </div>
  );
};
