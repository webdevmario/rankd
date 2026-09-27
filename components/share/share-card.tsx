"use client";

import { useLayoutEffect, useMemo, useRef, useState, type Ref } from "react";
import { initials } from "@/components/item-cover";
import {
  boardMetrics,
  CARD_PADDING,
  fitCoverWidth,
  FRAMES,
  type BoardMetrics,
  type ShareOptions,
} from "@/lib/share/options";
import { labelSize } from "@/components/tier/tier-styles";
import { TIER_COLOR_FILL } from "@/lib/tier-colors";
import { groupByTier, UNRANKED, zoneOf } from "@/lib/tiers";
import type { Item, List, TierDef } from "@/types/list";
import { THEME_STYLES, type ThemeStyle } from "./share-themes";

const CARD_RADIUS = 28;
const CARD_BORDER = 1;
const HEADER_GAP = 32;
const FOOTER_GAP = 28;

interface ShareCardProps {
  list: List;
  options: ShareOptions;
  /** Item id to cover data URL. Items missing from the map get an initials placeholder. */
  covers: Map<string, string>;
  collage?: string;
  /** Called when the board doesn't fit the frame even at the smallest cover size. */
  onOverflowChange?: (overflow: boolean) => void;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The image that gets exported: a frame (the theme's background) around a
 * card holding the list title and a tier board. Rendered at real export size
 * in pixels; the composer scales it down for the preview.
 */
export function ShareCard({ list, options, covers, collage, onOverflowChange, ref }: ShareCardProps) {
  const theme = THEME_STYLES[options.theme];
  const frame = FRAMES[options.frame];
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [chrome, setChrome] = useState({ header: 0, footer: 0 });

  const rows = useMemo(() => {
    const groups = groupByTier(list.items, list.tiers);
    const rows: { tier?: TierDef; items: Item[] }[] = list.tiers
      .filter((tier) => options.showEmptyTiers || groups[tier.id].length > 0)
      .map((tier) => ({ tier, items: groups[tier.id] }));
    if (options.showUnranked && groups[UNRANKED].length > 0) rows.push({ items: groups[UNRANKED] });
    return rows;
  }, [list.items, list.tiers, options.showEmptyTiers, options.showUnranked]);

  // The header and footer are plain text whose height depends on wrapping, so measure them.
  useLayoutEffect(() => {
    const next = {
      header: headerRef.current?.offsetHeight ?? 0,
      footer: footerRef.current?.offsetHeight ?? 0,
    };
    setChrome((prev) => (prev.header === next.header && prev.footer === next.footer ? prev : next));
  }, [list.title, options.showDetails, options.showWatermark, options.frame, options.padding]);

  const innerWidth = frame.width - options.padding * 2 - CARD_PADDING * 2 - CARD_BORDER * 2;
  const availableHeight =
    frame.height === undefined
      ? undefined
      : frame.height -
        options.padding * 2 -
        CARD_PADDING * 2 -
        CARD_BORDER * 2 -
        chrome.header -
        HEADER_GAP -
        (options.showWatermark ? chrome.footer + FOOTER_GAP : 0);
  const fit = fitCoverWidth(
    rows.map((row) => row.items.length),
    innerWidth,
    availableHeight,
    options.showTitles,
  );
  const metrics = boardMetrics(fit.cover, options.showTitles);

  useLayoutEffect(() => {
    onOverflowChange?.(fit.overflow);
  }, [fit.overflow, onOverflowChange]);

  const ranked = list.items.filter((item) => zoneOf(item, list.tiers) !== UNRANKED).length;
  const updated = new Date(list.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: frame.width,
        height: frame.height,
        padding: options.padding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: theme.background,
        color: theme.text,
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {options.theme === "collage" && collage && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.5)), url(${collage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          width: "100%",
          padding: CARD_PADDING,
          borderRadius: CARD_RADIUS,
          ...theme.card,
        }}
      >
        <header ref={headerRef}>
          <h2
            style={{
              margin: 0,
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
              textWrap: "balance",
            }}
          >
            {list.title}
          </h2>
          {options.showDetails && (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 22,
                color: theme.muted,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {ranked} ranked
              <span style={{ margin: "0 10px", opacity: 0.6 }}>·</span>
              {updated}
            </p>
          )}
        </header>

        <div style={{ marginTop: HEADER_GAP, display: "flex", flexDirection: "column", gap: metrics.rowGap }}>
          {rows.length === 0 ? (
            <p style={{ margin: 0, fontSize: 22, color: theme.muted }}>Nothing ranked yet.</p>
          ) : (
            rows.map((row) => (
              <TierRow
                key={row.tier?.id ?? UNRANKED}
                tier={row.tier}
                items={row.items}
                covers={covers}
                metrics={metrics}
                innerWidth={innerWidth}
                theme={theme}
                showTitles={options.showTitles}
              />
            ))
          )}
        </div>

        {options.showWatermark && (
          <footer
            ref={footerRef}
            style={{
              marginTop: FOOTER_GAP,
              display: "flex",
              justifyContent: "flex-end",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: theme.muted,
            }}
          >
            <span>
              rankd<span style={{ color: "#ff7a1a" }}>.</span>
            </span>
          </footer>
        )}
      </div>
    </div>
  );
}

interface TierRowProps {
  /** Absent for the unranked pool. */
  tier?: TierDef;
  items: Item[];
  covers: Map<string, string>;
  metrics: BoardMetrics;
  innerWidth: number;
  theme: ThemeStyle;
  showTitles: boolean;
}

function TierRow({ tier, items, covers, metrics, innerWidth, theme, showTitles }: TierRowProps) {
  const { gap, rowPadding, labelWidth, radius, coverHeight } = metrics;
  const size = tier ? labelSize(tier.label) : "long";
  const fontSize = !tier
    ? Math.round(labelWidth * 0.15)
    : Math.round(labelWidth * (size === "letter" ? 0.5 : size === "short" ? 0.28 : 0.17));

  return (
    <div
      style={{
        display: "flex",
        gap: rowPadding,
        padding: rowPadding,
        borderRadius: radius + 4,
        background: theme.row,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: labelWidth,
          borderRadius: radius + 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
          textAlign: "center",
          overflowWrap: "anywhere",
          lineHeight: 1.1,
          background: tier ? TIER_COLOR_FILL[tier.color] : theme.poolLabel,
          color: tier ? "#000000" : theme.poolLabelText,
          fontSize,
          fontWeight: tier && size !== "long" ? 900 : 700,
          letterSpacing: tier ? "-0.02em" : "0.08em",
          textTransform: tier ? undefined : "uppercase",
        }}
      >
        {tier ? tier.label : "Unranked"}
      </div>
      <div
        style={{
          width: innerWidth - labelWidth - rowPadding * 3,
          minHeight: items.length === 0 ? Math.round(coverHeight * 0.45) : undefined,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap,
        }}
      >
        {items.map((item) => (
          <Cover
            key={item.id}
            item={item}
            src={covers.get(item.id)}
            metrics={metrics}
            theme={theme}
            showTitle={showTitles}
          />
        ))}
      </div>
    </div>
  );
}

function Cover({
  item,
  src,
  metrics,
  theme,
  showTitle,
}: {
  item: Item;
  src?: string;
  metrics: BoardMetrics;
  theme: ThemeStyle;
  showTitle: boolean;
}) {
  const { cover, coverHeight, radius, titleFont, gap } = metrics;
  const lineHeight = 1.25;

  return (
    <div style={{ width: cover }}>
      <div
        style={{
          width: cover,
          height: coverHeight,
          borderRadius: radius,
          overflow: "hidden",
          background: theme.placeholder,
          boxShadow: theme.coverShadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {src ? (
          // Covers are inlined data URLs, which next/image doesn't handle.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              fontWeight: 600,
              fontSize: Math.round(cover * 0.2),
              color: theme.placeholderText,
            }}
          >
            {initials(item.title)}
          </span>
        )}
      </div>
      {showTitle && (
        <div
          style={{
            marginTop: Math.round(gap * 0.75),
            height: Math.round(titleFont * lineHeight * 2),
            fontSize: titleFont,
            lineHeight,
            fontWeight: 500,
            opacity: 0.85,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.title}
        </div>
      )}
    </div>
  );
}
