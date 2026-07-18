"use client";

import { Menu } from "lucide-react";
import { useMobileNav } from "@/providers/mobile-nav-provider";

export function MobileMenuButton() {
  const { setOpen } = useMobileNav();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
