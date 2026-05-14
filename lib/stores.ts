"use client";

import { create } from "zustand";

type WalletState = {
  connected: boolean;
  address: string;
  ethBalance: number;
  panelOpen: boolean;
  connect: () => void;
  disconnect: () => void;
  setBalance: (n: number) => void;
  setOpen: (b: boolean) => void;
};

export const useWallet = create<WalletState>((set) => ({
  connected: true,
  address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  ethBalance: 12.4,
  panelOpen: false,
  connect: () => set({ connected: true }),
  disconnect: () => set({ connected: false }),
  setBalance: (n) => set({ ethBalance: n }),
  setOpen: (b) => set({ panelOpen: b }),
}));

type UIState = {
  composerOpen: boolean;
  feedFilter: "ALL" | "LISTING" | "MARKET" | "PORTFOLIO";
  setComposer: (b: boolean) => void;
  setFilter: (f: UIState["feedFilter"]) => void;
};

export const useUI = create<UIState>((set) => ({
  composerOpen: false,
  feedFilter: "ALL",
  setComposer: (b) => set({ composerOpen: b }),
  setFilter: (f) => set({ feedFilter: f }),
}));
