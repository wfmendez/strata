"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export function FollowButton({
  userId,
  initial = false,
  className,
}: {
  userId: string;
  initial?: boolean;
  className?: string;
}) {
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !following;
    setFollowing(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/follow/${userId}`, {
        method: next ? "PUT" : "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    } catch (e: any) {
      setFollowing(!next);
      toast.error("Couldn't update follow", { description: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className={cn(
        "rounded-full px-3 py-1.5 text-[12px] font-medium transition-all",
        following
          ? "border border-border bg-transparent text-text-secondary hover:border-error/50 hover:text-error"
          : "bg-brand-gradient text-white shadow-glow hover:-translate-y-px",
        className,
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
