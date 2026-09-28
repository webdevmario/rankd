"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const EntranceContext = createContext(true);

/**
 * Cards rendered with the first paint of a board appear in place; only cards
 * that mount afterwards (a new item, a card dropped in another row) animate in.
 * Without this every card fades in on page load and on each mode switch.
 */
export function EntranceGate({ children }: { children: ReactNode }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);
  return <EntranceContext value={settled}>{children}</EntranceContext>;
}

/** Whether a card mounting now should play its entrance animation. */
export function useEntrance(): boolean {
  return useContext(EntranceContext);
}
