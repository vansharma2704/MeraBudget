import React, { Suspense } from "react";
import { BarLoader } from "react-spinners";

const DashboardLayout = ({ children }) => {
  return (
    <div className="px-5">
      <div className="flex items-center justify-between mt-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Dashboard</h1>
      </div>
      <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#d4a843" />}>
        {children}
      </Suspense>
    </div>
  );
};

export default DashboardLayout;