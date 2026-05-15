"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ExternalLink, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useWallet } from "@/lib/stores";
import { fmtEth, fmtUsd, ethToUsd, shortAddr } from "@/lib/format";
import { useEthUsd } from "./PriceProvider";
import { useFocusTrap } from "@/lib/useFocusTrap";

const txns = [
  { id: 1, type: "in", label: "Yield · PROP-NYC-001", amount: +0.034, time: "2h" },
  { id: 2, type: "out", label: "Invest · PROP-MIA-002", amount: -0.5, time: "1d" },
  { id: 3, type: "in", label: "Yield · PROP-MIA-002", amount: +0.058, time: "3d" },
  { id: 4, type: "out", label: "Invest · PROP-AUS-003", amount: -0.25, time: "5d" },
  { id: 5, type: "in", label: "Deposit", amount: +2.0, time: "1w" },
];

export function WalletPanel() {
  const { panelOpen, setOpen, connected, address, ethBalance } = useWallet();
  const price = useEthUsd();
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef as any, panelOpen, () => setOpen(false));

  return (
    <AnimatePresence>
      {panelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            ref={panelRef as any}
            role="dialog"
            aria-modal="true"
            aria-label="Wallet"
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-surface"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold tracking-wide">Wallet</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {!connected ? (
              <ConnectState />
            ) : (
              <div className="flex-1 overflow-y-auto p-5">
                <div className="rounded-xl border border-border bg-brand-gradient-soft p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                    Balance
                  </div>
                  <div className="mt-1 text-[28px] font-semibold tracking-tight">
                    {fmtEth(ethBalance)}
                  </div>
                  <div className="text-[13px] text-text-secondary">
                    ≈ {fmtUsd(ethToUsd(ethBalance, price))}
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-text-secondary">
                    <span>{shortAddr(address)}</span>
                    <a className="flex items-center gap-1 hover:text-text-primary" href={`#${address}`}>
                      View <ExternalLink size={11} />
                    </a>
                  </div>
                </div>

                <div className="mt-5 text-[11px] uppercase tracking-[0.16em] text-text-secondary">
                  Activity
                </div>
                <ul className="mt-2 divide-y divide-border/60 rounded-xl border border-border bg-surface-2">
                  {txns.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            t.type === "in"
                              ? "rounded-full bg-mint/10 p-1.5 text-mint"
                              : "rounded-full bg-error/10 p-1.5 text-error"
                          }
                        >
                          {t.type === "in" ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div>
                          <div className="text-[13px]">{t.label}</div>
                          <div className="text-[11px] text-text-secondary">{t.time} ago</div>
                        </div>
                      </div>
                      <div
                        className={
                          "font-mono text-[13px] " + (t.amount > 0 ? "text-mint" : "text-text-primary")
                        }
                      >
                        {t.amount > 0 ? "+" : ""}
                        {t.amount.toFixed(3)} ETH
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ConnectState() {
  const { connect } = useWallet();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-2xl border border-border bg-surface-2 p-6">
        <div className="mx-auto h-12 w-12 rounded-xl bg-brand-gradient" />
        <p className="mt-4 text-[14px] text-text-secondary">
          Connect a wallet to invest, post listings, and earn yield.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button onClick={connect} className="rounded-full bg-brand-gradient px-5 py-2 text-[13px] font-medium text-white shadow-glow">
            🦊 Connect MetaMask
          </button>
          <button onClick={connect} className="rounded-full border border-border px-5 py-2 text-[13px] hover:border-brand-violet">
            👻 Connect Phantom
          </button>
        </div>
      </div>
    </div>
  );
}
