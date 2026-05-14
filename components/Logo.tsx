import { cn } from "@/lib/cn";

// Stacked-layers "S" mark — 4 horizontal slabs, each offset 2px right,
// filled with brand gradient (left→right). The slabs form an S silhouette.
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("logo", className)}
      role="img"
      aria-label="STRATA"
    >
      <defs>
        <linearGradient id="strata-grad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      {/* 4 slabs, each shifted 2px right, height 6px, gap 2px */}
      <rect className="layer-1" x="2"  y="6"  width="28" height="6" rx="2" fill="url(#strata-grad)" />
      <rect className="layer-2" x="4"  y="14" width="28" height="6" rx="2" fill="url(#strata-grad)" />
      <rect className="layer-3" x="6"  y="22" width="28" height="6" rx="2" fill="url(#strata-grad)" />
      <rect className="layer-4" x="8"  y="30" width="28" height="6" rx="2" fill="url(#strata-grad)" />
    </svg>
  );
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={28} />
      <span className="text-[18px] font-semibold tracking-[0.18em] text-text-primary">
        STRATA
      </span>
    </div>
  );
}
