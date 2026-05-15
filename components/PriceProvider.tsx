"use client";

import { createContext, useContext } from "react";
import { DEFAULT_ETH_USD } from "@/lib/format";

const Ctx = createContext<number>(DEFAULT_ETH_USD);

export function PriceProvider({
  price,
  children,
}: {
  price: number;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={price}>{children}</Ctx.Provider>;
}

export function useEthUsd() {
  return useContext(Ctx);
}
