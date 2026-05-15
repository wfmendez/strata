import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getEthUsd } from "@/lib/eth-price";
import { fmtEth, fmtUsd, ethToUsd, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portfolio · STRATA",
  description: "Your tokenized real estate holdings and yield activity.",
};

export default async function PortfolioPage() {
  const [me, price] = await Promise.all([getCurrentUser(), getEthUsd()]);
  const [holdings, investments] = await Promise.all([
    prisma.holding.findMany({ where: { userId: me.id } }),
    prisma.investment.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      include: { post: { select: { tokenSymbol: true, address: true } } },
    }),
  ]);

  const totalValue = holdings.reduce((sum, h) => {
    const drift = 1 + Math.sin(h.id.charCodeAt(0)) * 0.1 + 0.05;
    return sum + h.tokens * h.entryPrice * drift;
  }, 0);

  return (
    <div className="max-w-[760px] pb-16">
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold">Portfolio</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          What you own, what it's worth, and how it's moving.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat title="Total Value" value={fmtUsd(ethToUsd(totalValue, price))} sub={fmtEth(totalValue)} highlight />
        <Stat title="Holdings" value={String(holdings.length)} sub="distinct tokens" />
        <Stat title="Investments" value={String(investments.length)} sub="lifetime" />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Holdings
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.14em] text-text-secondary">
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {holdings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    No holdings yet. Invest in a listing to begin.
                  </td>
                </tr>
              )}
              {holdings.map((h) => {
                const drift = 1 + Math.sin(h.id.charCodeAt(0)) * 0.1 + 0.05;
                const current = h.entryPrice * drift;
                const gain = (drift - 1) * 100;
                const value = h.tokens * current;
                return (
                  <tr key={h.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-mono text-gold">{h.tokenSymbol}</td>
                    <td className="px-4 py-3">{h.tokens}</td>
                    <td className="px-4 py-3">{h.entryPrice.toFixed(5)} ETH</td>
                    <td className="px-4 py-3">{fmtUsd(ethToUsd(value, price))}</td>
                    <td className={"px-4 py-3 text-right font-mono " + (gain >= 0 ? "text-mint" : "text-error")}>
                      {gain >= 0 ? "+" : ""}
                      {gain.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Recent Activity
        </h2>
        <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
          {investments.length === 0 && (
            <li className="px-4 py-8 text-center text-text-secondary">No investments yet.</li>
          )}
          {investments.map((i) => (
            <li key={i.id} className="flex items-center justify-between border-b border-border/60 px-4 py-3 last:border-0">
              <div>
                <div className="text-[13px]">
                  Invested in <span className="font-mono text-gold">{i.post.tokenSymbol}</span>
                </div>
                <div className="text-[11px] text-text-secondary">
                  {i.post.address} · {timeAgo(i.createdAt)} ago
                </div>
              </div>
              <div className="font-mono text-[13px]">{fmtEth(i.amountEth)}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ title, value, sub, highlight }: { title: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border border-border p-4 " +
        (highlight ? "bg-brand-gradient-soft" : "bg-surface")
      }
    >
      <div className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">{title}</div>
      <div className="mt-2 text-[24px] font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-[12px] text-text-secondary">{sub}</div>}
    </div>
  );
}
