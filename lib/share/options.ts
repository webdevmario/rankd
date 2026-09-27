/**
 * Settings for the share-image composer, plus the pure layout maths that fits
 * a tier board into a fixed frame. All sizes are in export pixels at 1x.
 */

export const SHARE_THEMES = ["ember", "collage", "midnight", "paper"] as const;
export type ShareTheme = (typeof SHARE_THEMES)[number];

export const SHARE_FRAMES = ["auto", "square", "portrait", "story"] as const;
export type ShareFrame = (typeof SHARE_FRAMES)[number];

export const SHARE_SCALES = [1, 2, 3] as const;
export type ShareScale = (typeof SHARE_SCALES)[number];

export interface FrameSpec {
  label: string;
  hint: string;
  width: number;
  /** Absent means the frame grows to fit the board. */
  height?: number;
}

export const FRAMES: Record<ShareFrame, FrameSpec> = {
  auto: { label: "Auto", hint: "Fits the board", width: 1200 },
  square: { label: "Square", hint: "1:1", width: 1080, height: 1080 },
  portrait: { label: "Portrait", hint: "4:5", width: 1080, height: 1350 },
  story: { label: "Story", hint: "9:16", width: 1080, height: 1920 },
};

export interface ShareOptions {
  theme: ShareTheme;
  frame: ShareFrame;
  padding: number;
  scale: ShareScale;
  showTitles: boolean;
  showEmptyTiers: boolean;
  showUnranked: boolean;
  showDetails: boolean;
  showWatermark: boolean;
}

export const DEFAULT_SHARE_OPTIONS: ShareOptions = {
  theme: "ember",
  frame: "portrait",
  padding: 72,
  scale: 2,
  showTitles: false,
  showEmptyTiers: false,
  showUnranked: false,
  showDetails: true,
  showWatermark: true,
};

export const PADDING_RANGE = { min: 24, max: 160, step: 8 } as const;

/** Space between the card's edge and its content. */
export const CARD_PADDING = 44;

/** Cover width used when the frame grows to fit (auto). */
const AUTO_COVER_WIDTH = 132;
const MIN_COVER_WIDTH = 40;
const MAX_COVER_WIDTH = 190;

/** Every size in a board, derived from one number: the cover width. */
export interface BoardMetrics {
  cover: number;
  coverHeight: number;
  gap: number;
  rowPadding: number;
  rowGap: number;
  labelWidth: number;
  titleFont: number;
  /** Height of the two-line title under each cover, 0 when titles are hidden. */
  titleBlock: number;
  radius: number;
}

export function boardMetrics(cover: number, showTitles: boolean): BoardMetrics {
  const gap = clamp(Math.round(cover * 0.08), 6, 14);
  const titleFont = clamp(Math.round(cover * 0.105), 11, 17);
  return {
    cover,
    coverHeight: Math.round(cover * 1.5),
    gap,
    rowPadding: gap,
    rowGap: Math.round(gap * 0.75),
    labelWidth: clamp(Math.round(cover * 0.62), 52, 104),
    titleFont,
    titleBlock: showTitles ? Math.round(titleFont * 1.25 * 2 + gap * 0.75) : 0,
    radius: clamp(Math.round(cover * 0.06), 4, 10),
  };
}

/** Height of one tier row holding `count` covers in a row `innerWidth` wide. */
export function rowHeight(metrics: BoardMetrics, count: number, innerWidth: number): number {
  const { cover, coverHeight, gap, rowPadding, labelWidth, titleBlock } = metrics;
  if (count === 0) return Math.round(coverHeight * 0.45) + rowPadding * 2;
  // Row padding sits on both sides and again between the label and the covers.
  const coversWidth = innerWidth - labelWidth - rowPadding * 3;
  const perLine = Math.max(1, Math.floor((coversWidth + gap) / (cover + gap)));
  const lines = Math.ceil(count / perLine);
  const itemHeight = coverHeight + titleBlock;
  return lines * itemHeight + (lines - 1) * gap + rowPadding * 2;
}

export function boardHeight(metrics: BoardMetrics, rowCounts: number[], innerWidth: number): number {
  const rows = rowCounts.reduce((sum, count) => sum + rowHeight(metrics, count, innerWidth), 0);
  return rows + Math.max(0, rowCounts.length - 1) * metrics.rowGap;
}

/**
 * The largest cover width whose board fits `availableHeight`. With no height
 * (an auto frame) the board uses a fixed, comfortable cover size instead.
 * Returns `overflow: true` when even the smallest covers don't fit.
 */
export function fitCoverWidth(
  rowCounts: number[],
  innerWidth: number,
  availableHeight: number | undefined,
  showTitles: boolean,
): { cover: number; overflow: boolean } {
  if (availableHeight === undefined) return { cover: AUTO_COVER_WIDTH, overflow: false };
  for (let cover = MAX_COVER_WIDTH; cover >= MIN_COVER_WIDTH; cover -= 2) {
    if (boardHeight(boardMetrics(cover, showTitles), rowCounts, innerWidth) <= availableHeight) {
      return { cover, overflow: false };
    }
  }
  return { cover: MIN_COVER_WIDTH, overflow: true };
}

/** Reads saved options, keeping only values that are still valid. */
export function parseShareOptions(raw: unknown): ShareOptions {
  const saved = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof ShareOptions, unknown>>;
  const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
    allowed.includes(value as T) ? (value as T) : fallback;
  const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);
  const d = DEFAULT_SHARE_OPTIONS;
  const padding =
    typeof saved.padding === "number"
      ? clamp(Math.round(saved.padding), PADDING_RANGE.min, PADDING_RANGE.max)
      : d.padding;
  return {
    theme: pick(saved.theme, SHARE_THEMES, d.theme),
    frame: pick(saved.frame, SHARE_FRAMES, d.frame),
    padding,
    scale: pick(saved.scale, SHARE_SCALES, d.scale),
    showTitles: flag(saved.showTitles, d.showTitles),
    showEmptyTiers: flag(saved.showEmptyTiers, d.showEmptyTiers),
    showUnranked: flag(saved.showUnranked, d.showUnranked),
    showDetails: flag(saved.showDetails, d.showDetails),
    showWatermark: flag(saved.showWatermark, d.showWatermark),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
