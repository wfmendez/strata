"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Wallet, User, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { useUI } from "@/lib/stores";

export function MobileNav({ username }: { username: string }) {
  const pathname = usePathname();
  const { setComposer } = useUI();

  const tabs = [
    { href: "/", label: "Feed", icon: Home, active: pathname === "/" },
    { href: "/explore", label: "Explore", icon: Compass, active: pathname.startsWith("/explore") },
    { href: "/portfolio", label: "Portfolio", icon: Wallet, active: pathname.startsWith("/portfolio") },
    { href: `/profile/${username}`, label: "Profile", icon: User, active: pathname.startsWith("/profile") },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-bg/90 px-3 py-2 backdrop-blur-md lg:hidden"
    >
      {tabs.slice(0, 2).map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px]",
            active ? "text-text-primary" : "text-text-secondary",
          )}
        >
          <Icon size={18} className={active ? "text-brand-violet" : ""} />
          {label}
        </Link>
      ))}
      <button
        onClick={() => setComposer(true)}
        aria-label="New post"
        className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient text-white shadow-glow"
      >
        <Plus size={20} />
      </button>
      {tabs.slice(2).map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px]",
            active ? "text-text-primary" : "text-text-secondary",
          )}
        >
          <Icon size={18} className={active ? "text-brand-violet" : ""} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
