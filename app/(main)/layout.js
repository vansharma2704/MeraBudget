import React from "react";
import { checkUser } from "@/lib/checkUser";

// All pages in (main) are personalized — opt out of static caching
export const dynamic = "force-dynamic";
// The configured Supabase pooler is in AWS ap-southeast-2. Running personalized
// server routes in Sydney avoids a cross-region database round trip on each query.
export const preferredRegion = ["syd1"];
// PDF parsing and OCR fallback setup can take longer than a normal CRUD action.
export const maxDuration = 60;

const Mainlayout = async ({ children }) => {
  await checkUser();
  return <div className="container mx-auto w-full px-3 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 min-h-screen overflow-y-visible">{children}</div>;
};

export default Mainlayout;
