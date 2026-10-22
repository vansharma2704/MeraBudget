import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react';
import { getTransaction } from '@/actions/transaction';

// Import the new wrapper component, NOT the form itself
import TransactionFormLoader from '../_components/transaction-form-loader';

const AdTransactionPage = async ({ searchParams }) => {
  const params = (await searchParams) || {};
  const editId = params.edit;
  // Details passed from the dashboard receipt scanner
  const prefill = !editId && params.amount
    ? {
        amount: String(params.amount),
        date: params.date || null,
        description: params.description || "",
        category: defaultCategories.some((c) => c.id === params.category) ? params.category : undefined,
      }
    : null;
  // Fetch accounts and (when editing) the transaction in parallel
  const [accounts, initialData] = await Promise.all([
    getUserAccounts(),
    editId
      ? getTransaction(editId).catch((error) => {
          console.error("Failed to fetch transaction:", error);
          return null;
        })
      : null,
  ]);

  return (
    <div className="max-w-3xl mx-auto px-5 mb-20 transform-gpu transition-all duration-700">
        <h1 className="text-3xl min-[400px]:text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 sm:mb-12 uppercase break-words">
          {editId ? "Edit" : "New"} <span className="text-primary italic">Transaction</span>
        </h1>

        {/* Render the loader, which will handle the dynamic import */}
        <TransactionFormLoader 
          accounts = {accounts}
          categories = {defaultCategories}
          editMode = {!!editId}
          initialData = {initialData}
          prefill = {prefill}
        />
    </div>
  );
};

export default AdTransactionPage;
