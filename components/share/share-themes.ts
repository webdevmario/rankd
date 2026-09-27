import type { CSSProperties } from "react";
import type { ShareTheme } from "@/lib/share/options";

/**
 * How each export theme paints the frame and the card inside it. Colours are
 * literal (not CSS variables) so the exported image never depends on the app's
 * palette at capture time.
 */
export interface ThemeStyle {
  label: string;
  /** Frame background. The collage theme layers its generated image on top. */
  background: string;
  /** Small preview for the theme picker. */
  swatch: string;
  card: CSSProperties;
  text: string;
  muted: string;
  row: string;
  /** Background for the unranked pool's label cell. */
  poolLabel: string;
  poolLabelText: string;
  placeholder: string;
  placeholderText: string;
  coverShadow: string;
}

const EMBER_BACKGROUND = [
  "radial-gradient(120% 80% at 0% 0%, #ff4d5e 0%, transparent 55%)",
  "radial-gradient(100% 70% at 100% 8%, #ffc233 0%, transparent 52%)",
  "radial-gradient(130% 90% at 40% 100%, #ff7a1a 0%, transparent 62%)",
  "#3a1206",
].join(", ");

const DARK_CARD = {
  text: "#ffffff",
  muted: "#9a9a9a",
  row: "rgba(255, 255, 255, 0.045)",
  poolLabel: "#262626",
  poolLabelText: "#bdbdbd",
  placeholder: "linear-gradient(135deg, #2a2a2a, #111111)",
  placeholderText: "#7a7a7a",
  coverShadow: "0 8px 20px -8px rgba(0, 0, 0, 0.7)",
};

export const THEME_STYLES: Record<ShareTheme, ThemeStyle> = {
  ember: {
    label: "Ember",
    background: EMBER_BACKGROUND,
    swatch: EMBER_BACKGROUND,
    card: {
      background: "rgba(10, 10, 10, 0.93)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 40px 100px -20px rgba(40, 6, 0, 0.7), 0 0 0 1px rgba(0, 0, 0, 0.2)",
    },
    ...DARK_CARD,
  },
  collage: {
    label: "Collage",
    background: "#161210",
    swatch: "linear-gradient(135deg, #5b3a2a, #1d2a3a 55%, #3a2f1a)",
    card: {
      background: "rgba(8, 8, 8, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 40px 100px -20px rgba(0, 0, 0, 0.8)",
    },
    ...DARK_CARD,
  },
  midnight: {
    label: "Midnight",
    background: "radial-gradient(90% 55% at 50% 0%, rgba(255, 122, 26, 0.22), transparent 70%), #050505",
    swatch: "radial-gradient(100% 70% at 50% 0%, rgba(255, 122, 26, 0.45), transparent 70%), #050505",
    card: {
      background: "#0c0c0c",
      border: "1px solid #242424",
      boxShadow: "0 40px 100px -30px rgba(0, 0, 0, 0.9)",
    },
    ...DARK_CARD,
  },
  paper: {
    label: "Paper",
    background: "#ece4d6",
    swatch: "linear-gradient(135deg, #f6f1e7, #e2d8c6)",
    card: {
      background: "#fbf8f2",
      border: "1px solid rgba(60, 40, 20, 0.08)",
      boxShadow: "0 30px 80px -20px rgba(80, 55, 25, 0.28)",
    },
    text: "#16130f",
    muted: "#776e62",
    row: "rgba(60, 40, 20, 0.05)",
    poolLabel: "#e6ddcf",
    poolLabelText: "#5c5348",
    placeholder: "linear-gradient(135deg, #e8e0d2, #d6cab6)",
    placeholderText: "#8a7f70",
    coverShadow: "0 8px 18px -8px rgba(80, 55, 25, 0.45)",
  },
};

/** Tier label fills, matching the board. S blends red into gold. */
export const TIER_LABEL_FILL = {
  S: "linear-gradient(135deg, #ff4d5e, #ffc233)",
  A: "#ff7a1a",
  B: "#ffd84d",
  C: "#4ade80",
  D: "#5aa9ff",
  F: "#8a8a8a",
} as const;
