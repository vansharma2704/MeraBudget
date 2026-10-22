"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";
import { useFetch } from "@/hooks/use-fetch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowDownRight, ArrowUpRight, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { updateDefaultAccount, deleteAccount } from "@/actions/dashboard";

export default function AccountCard({ account }) {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error: updateError,
  } = useFetch(updateDefaultAccount);

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deletedAccount,
    error: deleteError,
  } = useFetch(deleteAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    if (isDefault) {
      toast.warning("You must have at least 1 default account");
      return;
    }
    await updateDefaultFn(id);
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    if (window.confirm("Are you sure you want to delete this account?")) {
      await deleteFn(id);
    }
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
    if (updateError) {
      toast.error(updateError.message || "Failed to update default account");
    }
  }, [updatedAccount, updateError]);

  useEffect(() => {
    if (deletedAccount?.success) {
      toast.success("Account deleted successfully");
    }
    if (deleteError) {
      toast.error(deleteError.message || "Failed to delete account");
    }
  }, [deletedAccount, deleteError]);

  return (
    <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <Link href={`/account/${id}`} className="flex flex-col flex-grow z-10">
        <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
          <span className="text-white">{name}</span>
          {updateDefaultLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Switch
              checked={isDefault}
              onClick={handleDefaultChange}
              className="data-[state=checked]:bg-primary scale-75"
            />
          )}
        </CardHeader>
        <CardContent className="p-6 flex-grow">
          <div className="text-3xl font-bold mb-2 text-white">
            ₹{parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {type.toLowerCase()} account
          </p>
        </CardContent>
      </Link>

      <CardFooter className="flex items-center justify-between text-[10px] text-slate-500 border-t border-white/10 pt-4 z-10 bg-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center text-teal-400 font-bold uppercase tracking-tighter">
            <ArrowUpRight className="mr-1 h-3 w-3 shadow-teal-500/50" />
            + income
          </div>
          <div className="flex items-center text-red-400 font-bold uppercase tracking-tighter">
            <ArrowDownRight className="mr-1 h-3 w-3 shadow-red-500/50" />
            - expense
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all rounded-full"
          disabled={deleteLoading}
          onClick={handleDelete}
        >
          {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}