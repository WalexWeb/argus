"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import { NavIcon } from "./NavIcon";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import { ReloadButton } from "@/components/ReloadButton";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-sidebar flex h-screen w-70 shrink-0 flex-col">
      <div className="flex justify-center items-center border-b border-pistachio-500/10 px-3 pt-6">
        <Logo size={100} showText />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
          Аналитика
        </p>
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-all duration-200",
                active
                  ? "bg-pistachio-500/15 text-pistachio-300 shadow-sm shadow-pistachio-500/10"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  active
                    ? "text-pistachio-400"
                    : "text-zinc-500 group-hover:text-zinc-400",
                )}
              >
                <NavIcon name={item.icon} />
              </span>
              <div className="min-w-0">
                <p className="text-base font-medium">{item.label}</p>
                <p className="truncate text-sm text-zinc-600 group-hover:text-zinc-500">
                  {item.description}
                </p>
              </div>
              {active && (
                <span className="ml-auto h-2 w-2 rounded-full bg-pistachio-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-pistachio-500/10 p-4">
        <ReloadButton />
        <p className="text-center text-xs text-zinc-600">data/mock-logs.json</p>
      </div>
    </aside>
  );
}
