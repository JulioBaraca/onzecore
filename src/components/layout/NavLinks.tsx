"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface ResolvedNavItem {
  href: string;
  label: string;
}

export function NavLinks({ items }: { items: ResolvedNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-[var(--club-primary)] bg-[var(--club-primary-soft)] text-[var(--club-primary)]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
