"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Building2, LineChart, Wallet, ArrowLeft } from "lucide-react";
import { useUI } from "@/lib/stores";
import { cn } from "@/lib/cn";
import { ethToUsd, fmtUsd } from "@/lib/format";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;
type Type = "LISTING" | "MARKET" | "PORTFOLIO";

export function Composer() {
  const { composerOpen, setComposer } = useUI();
  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<Type | null>(null);
  const [form, setForm] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function close() {
    setComposer(false);
    setTimeout(() => {
      setStep(1);
      setType(null);
      setForm({});
    }, 250);
  }

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...form }),
      });
      if (res.ok) {
        close();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {composerOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => (s - 1) as Step)}
                    className="text-text-secondary hover:text-text-primary"
                    aria-label="Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h2 className="text-[15px] font-semibold tracking-wide">
                  {step === 1 && "New Post"}
                  {step === 2 && `New ${type}`}
                  {step === 3 && "Preview"}
                </h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                  Step {step} / 3
                </span>
              </div>
              <button onClick={close} aria-label="Close" className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </header>

            <div className="p-5">
              {step === 1 && (
                <TypePicker
                  onPick={(t) => {
                    setType(t);
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && type && (
                <Form
                  type={type}
                  form={form}
                  setForm={setForm}
                  onContinue={() => setStep(3)}
                />
              )}
              {step === 3 && type && (
                <Preview
                  type={type}
                  form={form}
                  busy={busy}
                  onPost={submit}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypePicker({ onPick }: { onPick: (t: Type) => void }) {
  const cards: { t: Type; icon: React.ReactNode; title: string; desc: string }[] = [
    { t: "LISTING", icon: <Building2 size={20} />, title: "Tokenized Listing", desc: "List a property for fractional investment." },
    { t: "MARKET", icon: <LineChart size={20} />, title: "Market Take", desc: "Share a thesis, chart, or hot take." },
    { t: "PORTFOLIO", icon: <Wallet size={20} />, title: "Portfolio Update", desc: "Show your current allocation moves." },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <button
          key={c.t}
          onClick={() => onPick(c.t)}
          className="group rounded-xl border border-border bg-surface-2 p-4 text-left transition-all hover:-translate-y-1 hover:border-brand-violet/60 hover:shadow-glow"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white">
            {c.icon}
          </div>
          <div className="mt-3 text-[14px] font-semibold">{c.title}</div>
          <div className="mt-1 text-[12px] text-text-secondary">{c.desc}</div>
        </button>
      ))}
    </div>
  );
}

function Form({
  type,
  form,
  setForm,
  onContinue,
}: {
  type: Type;
  form: any;
  setForm: (f: any) => void;
  onContinue: () => void;
}) {
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  return (
    <div className="flex flex-col gap-4">
      {type === "LISTING" && (
        <>
          <Field label="Property address">
            <input
              className={inputCls}
              placeholder="e.g. 247 W 38th St, New York"
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Asking price (ETH)">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={form.priceEth ?? ""}
                onChange={(e) => set("priceEth", parseFloat(e.target.value))}
              />
              {form.priceEth > 0 && (
                <div className="mt-1 font-mono text-[11px] text-text-secondary">
                  ≈ {fmtUsd(ethToUsd(form.priceEth))}
                </div>
              )}
            </Field>
            <Field label="Projected APY (%)">
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={form.yieldAPY ?? ""}
                onChange={(e) => set("yieldAPY", parseFloat(e.target.value))}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Token symbol">
              <input
                className={inputCls}
                placeholder="PROP-CITY-NUM"
                value={form.tokenSymbol ?? ""}
                onChange={(e) => set("tokenSymbol", e.target.value)}
              />
            </Field>
            <Field label="Total supply">
              <input
                type="number"
                className={inputCls}
                value={form.tokenSupply ?? ""}
                onChange={(e) => set("tokenSupply", parseInt(e.target.value))}
              />
            </Field>
            <Field label="Min invest (ETH)">
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={form.minInvest ?? ""}
                onChange={(e) => set("minInvest", parseFloat(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Image URL">
            <input
              className={inputCls}
              placeholder="https://picsum.photos/seed/..."
              value={form.imageUrl ?? ""}
              onChange={(e) => set("imageUrl", e.target.value)}
            />
          </Field>
        </>
      )}

      <Field label={type === "PORTFOLIO" ? "Commentary" : "Content"}>
        <textarea
          rows={4}
          maxLength={500}
          className={cn(inputCls, "resize-none")}
          placeholder="Make it count…"
          value={form.content ?? ""}
          onChange={(e) => set("content", e.target.value)}
        />
        <div className="mt-1 text-right font-mono text-[10px] text-text-secondary">
          {(form.content ?? "").length} / 500
        </div>
      </Field>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!form.content?.trim()}
          className="rounded-full bg-brand-gradient px-5 py-2 text-[13px] font-medium text-white shadow-glow disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Preview({ type, form, busy, onPost }: any) {
  return (
    <div>
      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <div className="text-[11px] uppercase tracking-[0.16em] text-text-secondary">
          {type}
        </div>
        {form.address && (
          <div className="mt-2 text-[14px] font-semibold">{form.address}</div>
        )}
        {form.tokenSymbol && (
          <div className="font-mono text-[11px] text-gold">{form.tokenSymbol}</div>
        )}
        {form.yieldAPY && (
          <div className="mt-2 text-mint">{form.yieldAPY}% APY</div>
        )}
        <p className="mt-3 whitespace-pre-wrap text-[14px] text-text-primary">
          {form.content}
        </p>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onPost}
          disabled={busy}
          className="rounded-full bg-brand-gradient px-5 py-2 text-[13px] font-medium text-white shadow-glow disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-text-primary placeholder:text-text-secondary focus:border-brand-violet focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.16em] text-text-secondary">
        {label}
      </span>
      {children}
    </label>
  );
}
