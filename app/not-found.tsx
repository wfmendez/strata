import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="h-14 w-14 rounded-2xl bg-brand-gradient" />
      <h1 className="mt-4 text-[22px] font-semibold">Off the layer.</h1>
      <p className="mt-1 text-[13px] text-text-secondary">
        This page doesn't exist on STRATA.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-full bg-brand-gradient px-4 py-2 text-[13px] font-medium text-white shadow-glow"
      >
        Back to feed
      </Link>
    </div>
  );
}
