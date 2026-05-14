const ETH_USD = 3400; // mock spot for display

export function ethToUsd(eth: number) {
  return eth * ETH_USD;
}

export function fmtUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function fmtEth(n: number) {
  return `${n.toFixed(n < 1 ? 3 : 2)} ETH`;
}

export function shortAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function timeAgo(iso: string | Date) {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}
