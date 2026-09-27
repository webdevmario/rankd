import type { TierColor } from "@/types/list";

/**
 * Fill for each preset tier colour, as a CSS background. Literal values (not
 * theme variables) so the share export paints exactly what the board shows.
 * Label text on every fill is black.
 */
export const TIER_COLOR_FILL: Record<TierColor, string> = {
  sunset: "linear-gradient(135deg, #ff4d5e, #ffc233)",
  red: "#ff4d5e",
  orange: "#ff7a1a",
  amber: "#ffa53d",
  yellow: "#ffd84d",
  lime: "#b5e550",
  green: "#4ade80",
  teal: "#2dd4bf",
  blue: "#5aa9ff",
  indigo: "#8b93ff",
  purple: "#c084fc",
  pink: "#f78fc4",
  grey: "#8a8a8a",
  white: "#e8e8e8",
};

export const TIER_COLOR_NAME: Record<TierColor, string> = {
  sunset: "Sunset",
  red: "Red",
  orange: "Orange",
  amber: "Amber",
  yellow: "Yellow",
  lime: "Lime",
  green: "Green",
  teal: "Teal",
  blue: "Blue",
  indigo: "Indigo",
  purple: "Purple",
  pink: "Pink",
  grey: "Grey",
  white: "White",
};
