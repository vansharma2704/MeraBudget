import {
  BarChart3,
  Repeat,
  CreditCard,
  Bell,
  Mail,
  ShieldCheck,
  ArrowUpDown,
  WalletCards,
  Smartphone,
} from "lucide-react";

// Product highlights (shown once, below the hero)
export const featureHighlights = [
  { icon: ArrowUpDown, title: "Income & Expenses", description: "Track every rupee in one place." },
  { icon: WalletCards, title: "Budget Planning", description: "Build budgets that fit your goals." },
  { icon: BarChart3, title: "Spending Insights", description: "Understand where your money goes." },
  { icon: Smartphone, title: "Responsive Design", description: "Manage money on any device." },
];

// Everything else, as a compact list
export const extrasData = [
  { icon: Repeat, title: "Subscriptions", description: "No surprise renewals." },
  { icon: Bell, title: "Bill reminders", description: "Never miss a due date." },
  { icon: BarChart3, title: "PDF & Excel export", description: "Your data, your way." },
  { icon: CreditCard, title: "Multi-account", description: "All your accounts, one view." },
  { icon: ShieldCheck, title: "Bank-grade security", description: "Encrypted, never shared." },
  { icon: Mail, title: "Monthly reports", description: "A summary in your inbox." },
];

// Testimonials — the first one is featured
export const testimonialsData = [
  {
    name: "Priya Sharma",
    role: "Startup Founder",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    quote:
      "MeraBudget transformed how I manage both personal and business finances. The AI insights alone saved me ₹40,000 in the first month.",
  },
  {
    name: "Arjun Mehta",
    role: "Software Engineer",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "I photograph my bills and it categorises everything. My expense tracking went from 0% to 100%.",
  },
  {
    name: "Ananya Patel",
    role: "Financial Consultant",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    quote:
      "I recommend it to every client. The reports and multi-account support feel like enterprise tools.",
  },
];
