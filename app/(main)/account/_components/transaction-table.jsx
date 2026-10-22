"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


import { format } from "date-fns";

import React, { useEffect, useMemo, useState } from "react";

import { ChevronDown, ChevronUp, Clock, MoreHorizontal, RefreshCcw, Search, Trash, X } from "lucide-react";

import { categoryColors } from "@/data/categories";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Badge } from "@/components/ui/badge";

import { TooltipProvider } from "@radix-ui/react-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFetch } from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/accounts";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

const RECCURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const isValidDate = (d) => d && !isNaN(new Date(d));

const TransactionTable = ({ transactions }) => {
  const router = useRouter();

  const [selectedIds,setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field:"date",
    direction:"desc",
  });
 
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE =10;
  

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);


  const filteredAndSortedTransactions = useMemo(() => {
    let result = [... transactions];

  if (searchTerm){
    const searchLower = searchTerm.toLowerCase();
    result = result.filter((transaction) => 
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.keywords?.some((k) => k.includes(searchLower))
    );
  }

  if(recurringFilter){
    result = result.filter((transaction) => {
      if(recurringFilter === "recurring") return transaction.isRecurring;
      return !transaction.isRecurring;
    });
  }

  if(typeFilter){
    result = result.filter((transaction) => transaction.type === typeFilter);
  }

  result.sort((a,b) => {
    let comparison = 0;

    switch (sortConfig.field){
      case "date":
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "category":
        comparison = a.category.localeCompare(b.category);
        break;

      default:
        comparison = 0;
        break;
    }
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

    return result;
  },[transactions,searchTerm,typeFilter,recurringFilter,sortConfig,]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);
  
  const handleSort = (field) => {
    setSortConfig(current=>({
      field,
      direction:
      current.field==field && current.direction === "asc" ?"desc":"asc"

    }))
  };

  const handleSelect=(id)=>{
    setSelectedIds((current) =>
      current.includes(id)
    ?current.filter((item) => item !=id)
    :[...current,id]
);
  };

  const handleSelectAll=(id)=>{ setSelectedIds((current) =>
      current.length === paginatedTransactions.length  
    ? []
    : paginatedTransactions.map((t) => t.id)
);};

const handleBulkDelete= async () => {
  if(!window.confirm(
      `Are you sure you want to delete ${selectedIds.length} transactions?`
    ))
    {
      return;
    }
    deleteFn(selectedIds);
    
  };

  useEffect(() =>{
    if (deleted && !deleteLoading){
      toast.success("Transactions deleted successfully");
      setSelectedIds([]);
    }
  }, [deleted , deleteLoading]);

const handleClearFilters=() => {
  setSearchTerm("");
  setTypeFilter("");
  setRecurringFilter("");
  setSelectedIds([]);
};


  return (
    <div className="space-y-6">
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#d4a843" />
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors"/>
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-inner" 
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white rounded-xl h-11">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-[#232a38] border-white/10">
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={recurringFilter} onValueChange={(value)=>setRecurringFilter(value)}>
            <SelectTrigger className="w-[170px] bg-white/5 border-white/10 text-white rounded-xl h-11">
              <SelectValue placeholder="Frequency" />
            </SelectTrigger>
            <SelectContent className="bg-[#232a38] border-white/10">
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="non-recurring">Non-recurring</SelectItem>
            </SelectContent>
          </Select> 

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-11 px-6 rounded-xl bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 shadow-lg shadow-red-500/10">
                <Trash className="h-4 w-4 mr-2" />
                Delete ({selectedIds.length})
              </Button>
            )}

            {(searchTerm || typeFilter || recurringFilter) && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClearFilters} 
                className="h-11 w-11 border-white/10 bg-white/5 text-slate-400 hover:text-white rounded-xl"
                title="Reset Parameters">
                <X className="h-4 w-4"/></Button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card overflow-x-auto shadow-2xl border-white/5 [&_table]:min-w-[760px]">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[50px] py-4">
                <Checkbox 
                  onCheckedChange={handleSelectAll}
                  checked={selectedIds.length === paginatedTransactions.length && paginatedTransactions.length > 0}
                  className="border-white/20 data-[state=checked]:bg-primary"
                />
              </TableHead>

              <TableHead className="cursor-pointer py-4" onClick={() => handleSort("date")}>
                <div className="flex items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                  Date
                  {sortConfig.field==='date' && (
                    sortConfig.direction==="asc" ? <ChevronUp className="ml-2 h-3 w-3 text-primary" /> : <ChevronDown className="ml-2 h-3 w-3 text-primary" />
                  )}
                </div>
              </TableHead>

              <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-500">Description</TableHead>

              <TableHead className="cursor-pointer" onClick={() => handleSort("category")}>
                <div className="flex items-center text-[10px] uppercase font-black tracking-widest text-slate-500">
                  Category 
                  {sortConfig.field==="category" && (
                    sortConfig.direction==="asc" ? <ChevronUp className="ml-2 h-3 w-3 text-primary" /> : <ChevronDown className="ml-2 h-3 w-3 text-primary" />
                  )}
                </div>
              </TableHead>

              <TableHead className="cursor-pointer text-right" onClick={() => handleSort("amount")}>
                <div className="flex items-center justify-end text-[10px] uppercase font-black tracking-widest text-slate-500">
                  Amount 
                  {sortConfig.field==='amount' && (
                    sortConfig.direction==="asc" ? <ChevronUp className="ml-2 h-3 w-3 text-primary" /> : <ChevronDown className="ml-2 h-3 w-3 text-primary" />
                  )}
                </div>
              </TableHead>

              <TableHead className="text-[10px] uppercase font-black tracking-widest text-slate-500">Type</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-700">No transactions found</p>
                    <p className="text-sm text-slate-500">Adjust your filters to see more results</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                  <TableCell>
                    <Checkbox 
                      onCheckedChange={() => handleSelect(transaction.id)}
                      checked={selectedIds.includes(transaction.id)}
                      className="border-white/10 data-[state=checked]:bg-primary"
                    />
                  </TableCell>

                  <TableCell className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                    {isValidDate(transaction.date) ? format(new Date(transaction.date), "dd MMM, yyyy") : "Invalid Time"}
                  </TableCell>

                  <TableCell className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                    {transaction.description || "Unnamed Transaction"}
                    {transaction.keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {transaction.keywords.map((k) => (
                          <span key={k} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gold-500/10 text-gold-200/90">{k}</span>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <span 
                      className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                      style={{
                        backgroundColor: `${categoryColors[transaction.category]}15`,
                        borderColor: `${categoryColors[transaction.category]}40`,
                        color: categoryColors[transaction.category],
                      }}
                    >
                      {transaction.category || "General"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className={`text-sm font-black ${transaction.type === "EXPENSE" ? "text-red-400" : "text-emerald-400"}`}>
                      {transaction.type === "EXPENSE" ? "-" : "+"}₹{transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>

                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-tighter">
                              <RefreshCcw className="h-2.5 w-2.5" /> 
                              {RECCURRING_INTERVALS[transaction.recurringInterval]}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#232a38] border-white/10">
                            <div className="space-y-1">
                              <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Next Pulse</p>
                              <p className="text-xs font-bold text-white">
                                {transaction.nextRecurringDate && format(new Date(transaction.nextRecurringDate), "PP")}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1.5 border-white/10 text-slate-500 text-[9px] font-black uppercase tracking-tighter group-hover:border-white/20 transition-colors">
                        <Clock className="h-2.5 w-2.5" /> One-time
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-white/5 rounded-full group">
                          <MoreHorizontal className="h-4 w-4 text-slate-500 group-hover:text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#232a38] border-white/10 translate-x-[-10px]">
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest" onClick={() => router.push(`/transaction/create?edit=${transaction.id}`)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-widest text-red-400 focus:bg-red-500/10" onClick={() => deleteFn([transaction.id])}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-6 border-t border-white/5 bg-white/[0.01]">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Page {currentPage} <span className="text-slate-700">of</span> {totalPages}
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="h-10 px-6 rounded-xl border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="h-10 px-6 rounded-xl border-white/10 bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
