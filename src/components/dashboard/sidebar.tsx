"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenText,
  Boxes,
  ClipboardList,
  Inbox,
  LayoutList,
  LogOut,
  MessageSquareText,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/setup", label: "Setup", icon: LayoutList },
  { href: "/dashboard/inbox", label: "Inbox", icon: Inbox },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/products", label: "Products", icon: Boxes },
  { href: "/dashboard/templates", label: "Templates", icon: MessageSquareText },
  { href: "/dashboard/knowledge-base", label: "Knowledge Base", icon: BookOpenText },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/follow-ups", label: "Follow Ups", icon: ClipboardList },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-full border-b border-zinc-200 bg-white/95 px-3 py-4 backdrop-blur md:h-screen md:w-72 md:border-b-0 md:border-r md:px-4">
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 flex-row">
        <Image
          src="/logo.png"
          alt="WAI Sales Assistant"
          width={180}
          height={60}
          className="mb-2 h-8 w-auto"
          priority
        />
        <div>
          <p className="text-sm font-semibold">WAI Sales Assistant</p>
          <p className="text-xs text-zinc-500">Dashboard UMKM</p>
        </div>
      </div>

      <nav className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Button
        type="button"
        variant="ghost"
        className="mt-6 w-full justify-start rounded-xl text-zinc-600 hover:text-zinc-900"
        onClick={handleLogout}
        disabled={loading}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Keluar
      </Button>
    </aside>
  );
}
