"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Wallet, User, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWallet, useUI } from "@/lib/stores";
import { fmtEth, fmtUsd, ethToUsd, shortAddr } from "@/lib/format";
import { useEthUsd } from "./PriceProvider";

export function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const { ethBalance, address, setOpen } = useWallet();
  const { setComposer } = useUI();
  const price = useEthUsd();

  const nav = [
    { href: "/", label: "Feed", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/portfolio", label: "Portfolio", icon: Wallet },
    { href: `/profile/${username}`, label: "Profile", icon: User },
  ];

  return (
    <aside className="sticky top-[64px] hidden h-[calc(100vh-80px)] w-[260px] shrink-0 flex-col gap-6 lg:flex">
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
                active
                  ? "bg-surface text-text-primary"
                  : "text-text-secondary hover:bg-surface/60 hover:text-text-primary",
              )}
            >
              <Icon
                size={18}
                className={cn(
                  "transition-colors",
                  active ? "text-brand-violet" : "text-text-secondary group-hover:text-text-primary",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setComposer(true)}
        className="group relative overflow-hidden rounded-xl bg-brand-gradient px-4 py-3 text-[14px] font-medium text-white shadow-glow transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <Plus size={16} /> New Post
        </span>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-brand-violet/60"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
            Wallet
          </span>
          <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint">
            Connected
          </span>
        </div>
        <div className="mt-3 text-[20px] font-semibold tracking-tight">
          {fmtEth(ethBalance)}
        </div>
        <div className="text-[12px] text-text-secondary">
          ≈ {fmtUsd(ethToUsd(ethBalance, price))}
        </div>
        <div className="mt-3 font-mono text-[11px] text-text-secondary">
          {shortAddr(address)}
        </div>
      </button>

      <div className="mt-auto rounded-xl bg-gold-tint p-4 text-[12px] leading-relaxed text-text-secondary">
        <span className="font-semibold text-gold">STRATA Tip</span>
        <p className="mt-1">
          Yield without occupancy data is just a sticker. Read the rent roll
          before you ape.
        </p>
      </div>
    </aside>
  );
}
