"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function FollowButton({ userId, initial = false }: { userId: string; initial?: boolean }) {
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !following;
    setFollowing(next); // optimistic
    setBusy(true);
    try {
      const res = await fetch(`/api/follow/${userId}`, {
        method: next ? "PUT" : "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setFollowing(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={cn(
        "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
        following
          ? "border border-border bg-transparent text-text-secondary hover:border-error/50 hover:text-error"
          : "bg-brand-gradient text-white shadow-glow hover:-translate-y-px",
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
