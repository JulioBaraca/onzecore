"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useMobileNav } from "@/providers/mobile-nav-provider";

export function MobileSidebarDrawer({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useMobileNav();
  const pathname = usePathname();

  // Close the drawer whenever the route changes (e.g. after tapping a nav link).
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-white px-4 py-5 shadow-xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
