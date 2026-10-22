"use client";

import React, { useEffect, useState } from "react";
import { 
  Drawer, 
  DrawerClose, 
  DrawerContent, 
  DrawerFooter, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger 
} from "./ui/drawer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/app/lib/schema";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { CreateAccount } from "@/actions/dashboard";
import { toast } from "sonner";

const CreateAccountDrawer = ({ children }) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {
    data: newAccount,
    error,
    fn: createAccountFn,
    loading: createAccountLoading,
  } = useFetch(CreateAccount);

  useEffect(() => {
    if (newAccount && !createAccountLoading) {
      toast.success("Account created successfully");
      reset();
      setOpen(false);
    }
  }, [createAccountLoading, newAccount, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error.error || error.message || "Failed to create account");
    }
  }, [error]);

  const onSubmit = async (data) => {
    await createAccountFn(data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="bg-[#232a38]/95 border-l border-white/10 backdrop-blur-2xl text-white">
        <DrawerHeader className="border-b border-white/10 pb-6">
          <DrawerTitle className="text-2xl font-black uppercase tracking-tight text-white">
            Create New Account
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-6 flex-1 overflow-y-auto">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor="name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Account Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Everyday Spending"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary/50"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs font-bold text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Account Type
              </label>
              <Select
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger id="type" className="w-full h-12 bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent className="bg-[#232a38] border-white/10 text-white">
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs font-bold text-red-500 mt-1">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="balance" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Initial Balance (₹)
              </label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary/50"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-xs font-bold text-red-500 mt-1">{errors.balance.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border p-4 border-white/10 bg-white/5 transition-all hover:bg-white/10">
              <div className="space-y-1">
                <label htmlFor="isDefault" className="text-sm font-bold text-white cursor-pointer uppercase tracking-tight">
                  Set as Default
                </label>
                <p className="text-[10px] text-slate-500 font-medium">Use this for primary transactions</p>
              </div>
              <Switch
                id="isDefault"
                onCheckedChange={(checked) => setValue("isDefault", checked)}
                checked={watch("isDefault")}
                className="data-[state=unchecked]:bg-white/10 data-[state=checked]:bg-primary"
              />
            </div>

            <DrawerFooter className="px-0 pt-8 mt-auto border-t border-white/10">
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  type="submit" 
                  className="flex-1 h-14 bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
                  disabled={createAccountLoading}
                >
                  {createAccountLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button type="button" variant="outline" className="flex-1 h-14 border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl uppercase font-bold tracking-widest">
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;