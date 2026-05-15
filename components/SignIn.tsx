"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, LogOut } from "lucide-react";
import { shortAddr } from "@/lib/format";

type Me = { id: string; username: string; walletAddress: string; avatar: string | null } | null;

const DEMO_USERS = ["alessandro", "gabi", "fernando", "mayachen", "jamesvolta"];

export function SignIn() {
  const router = useRouter();
  const [me, setMe] = useState<Me | "loading">("loading");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
  }, []);

  async function signInWallet() {
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : null);
    if (!eth) {
      toast.error("No wallet detected", { description: "Install MetaMask, or use Demo sign-in below." });
      return;
    }
    try {
      const [address] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const { nonce } = await fetch("/api/auth/nonce").then((r) => r.json());
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();
      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        "",
        "Welcome to STRATA. Sign this message to prove ownership.",
        "",
        `URI: ${uri}`,
        `Version: 1`,
        `Chain ID: 1`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join("\n");
      const signature = (await eth.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "verify failed");
      const { user } = await res.json();
      setMe(user);
      toast.success(`Signed in as @${user.username}`);
      router.refresh();
    } catch (e: any) {
      toast.error("Sign-in failed", { description: e.message ?? "" });
    }
  }

  async function demoSignIn(username: string) {
    const res = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      toast.error("Demo sign-in failed");
      return;
    }
    const { user } = await res.json();
    setMe(user);
    setOpen(false);
    toast.success(`Switched to @${user.username}`);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    setOpen(false);
    router.refresh();
  }

  if (me === "loading") {
    return <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />;
  }

  if (me) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1 text-[12px] hover:border-brand-violet/60"
        >
          {me.avatar && (
            <Image src={me.avatar} alt={me.username} width={20} height={20} className="rounded-full" />
          )}
          <span className="hidden sm:inline">@{me.username}</span>
          <span className="hidden font-mono text-text-secondary sm:inline">
            {shortAddr(me.walletAddress)}
          </span>
          <ChevronDown size={14} className="text-text-secondary" />
        </button>
        {open && (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            onMouseLeave={() => setOpen(false)}
          >
            <div className="border-b border-border px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              Switch demo user
            </div>
            {DEMO_USERS.map((u) => (
              <button
                key={u}
                onClick={() => demoSignIn(u)}
                className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface-2"
              >
                @{u}
              </button>
            ))}
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-[13px] text-text-secondary hover:text-error"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-brand-gradient px-3 py-1.5 text-[12px] font-medium text-white shadow-glow hover:-translate-y-px"
      >
        Sign in
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => {
              setOpen(false);
              signInWallet();
            }}
            className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface-2"
          >
            🦊 Sign-In with Ethereum
          </button>
          <div className="border-t border-border px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            Demo · pick a seeded user
          </div>
          {DEMO_USERS.map((u) => (
            <button
              key={u}
              onClick={() => demoSignIn(u)}
              className="block w-full px-3 py-2 text-left text-[13px] hover:bg-surface-2"
            >
              @{u}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
