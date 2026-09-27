"use client";

import { Copy, Download, Loader2, Share } from "lucide-react";
import { domToBlob } from "modern-screenshot";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FRAMES,
  PADDING_RANGE,
  SHARE_FRAMES,
  SHARE_SCALES,
  SHARE_THEMES,
  type ShareScale,
} from "@/lib/share/options";
import { cn } from "@/lib/utils";
import type { List } from "@/types/list";
import { ShareCard } from "./share-card";
import { THEME_STYLES } from "./share-themes";
import { useShareAssets } from "./use-share-assets";
import { useShareOptions } from "./use-share-options";

type Action = "download" | "copy" | "share";

/** A Carbon-style studio for turning a list into a polished PNG: live preview on one side, controls on the other. */
export function ShareComposer({ list }: { list: List }) {
  const [options, update] = useShareOptions();
  const { covers, collage, ready } = useShareAssets(list.items);
  const [overflow, setOverflow] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const canShare = useCanShareFiles();

  const frame = FRAMES[options.frame];
  const cardHeight = useElementHeight(cardRef);
  const frameHeight = frame.height ?? cardHeight;
  const filename = `${slugify(list.title) || "list"}-rankd.png`;

  // Safari only lets a share sheet open soon after a tap, and rendering can outlast that window.
  // When it does, the image is kept so the next tap shares it straight away.
  const prepared = useRef<{ key: string; blob: Blob } | null>(null);
  const renderKey = JSON.stringify([options, list.updatedAt, ready]);

  const render = useCallback(async (): Promise<Blob> => {
    if (prepared.current?.key === renderKey) return prepared.current.blob;
    const node = cardRef.current;
    if (!node) throw new Error("Nothing to export yet.");
    const blob = await domToBlob(node, {
      scale: options.scale,
      type: "image/png",
      width: frame.width,
      height: node.offsetHeight,
    });
    prepared.current = { key: renderKey, blob };
    return blob;
  }, [frame.width, options.scale, renderKey]);

  const run = async (action: Action, task: () => Promise<void>) => {
    setBusy(action);
    try {
      await task();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (action === "share" && error instanceof DOMException && error.name === "NotAllowedError") {
        toast("Image ready. Tap Share again to send it.");
        return;
      }
      console.error(error);
      toast.error(action === "copy" ? "Couldn't copy the image." : "Couldn't create the image.");
    } finally {
      setBusy(null);
    }
  };

  const download = () =>
    run("download", async () => {
      const url = URL.createObjectURL(await render());
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  const copy = () =>
    run("copy", async () => {
      // Handing ClipboardItem a promise keeps Safari's user-gesture check happy.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": render() })]);
      toast.success("Image copied.");
    });

  const share = () =>
    run("share", async () => {
      const file = new File([await render()], filename, { type: "image/png" });
      await navigator.share({ files: [file], title: list.title });
    });

  const outputWidth = frame.width * options.scale;
  const outputHeight = Math.round(frameHeight * options.scale);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <Preview width={frame.width} height={frameHeight} loading={!ready}>
        <ShareCard
          ref={cardRef}
          list={list}
          options={options}
          covers={covers}
          collage={collage}
          onOverflowChange={setOverflow}
        />
      </Preview>

      <aside className="flex flex-col gap-6 rounded-xl border bg-card p-5 lg:sticky lg:top-6">
        <Section title="Theme">
          <div className="grid grid-cols-4 gap-2">
            {SHARE_THEMES.map((theme) => {
              const style = THEME_STYLES[theme];
              const selected = options.theme === theme;
              return (
                <button
                  key={theme}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({ theme })}
                  className="group flex flex-col items-center gap-1.5 rounded-lg outline-none"
                >
                  <span
                    className={cn(
                      "h-12 w-full rounded-md ring-1 ring-border transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-ring",
                      selected && "ring-2 ring-primary",
                    )}
                    style={{
                      background:
                        theme === "collage" && collage ? `center / cover url(${collage})` : style.swatch,
                    }}
                  />
                  <span className={cn("text-xs", selected ? "text-foreground" : "text-muted-foreground")}>
                    {style.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Frame">
          <div className="grid grid-cols-4 gap-2">
            {SHARE_FRAMES.map((option) => {
              const spec = FRAMES[option];
              const selected = options.frame === option;
              const ratio = spec.height ? spec.width / spec.height : 1.25;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({ frame: option })}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border px-1 pt-2.5 pb-2 transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary bg-accent" : "border-border",
                  )}
                >
                  <span className="flex h-6 items-center">
                    <span
                      className={cn(
                        "block rounded-[3px] border-[1.5px]",
                        selected ? "border-primary" : "border-muted-foreground",
                        !spec.height && "border-dashed",
                      )}
                      style={{ height: ratio >= 1 ? 24 / ratio : 24, width: ratio >= 1 ? 24 : 24 * ratio }}
                    />
                  </span>
                  <span className="text-xs leading-none">{spec.label}</span>
                  <span className="text-[10px] leading-none text-faint">{spec.hint}</span>
                </button>
              );
            })}
          </div>
          {overflow && (
            <p className="mt-2 text-xs text-destructive">
              Too many items for this frame. Try Auto or a taller frame.
            </p>
          )}
        </Section>

        <Section
          title="Padding"
          aside={<span className="text-xs text-muted-foreground tabular-nums">{options.padding}px</span>}
        >
          <Slider
            aria-label="Padding"
            min={PADDING_RANGE.min}
            max={PADDING_RANGE.max}
            step={PADDING_RANGE.step}
            value={[options.padding]}
            onValueChange={(value) => {
              const padding = Array.isArray(value) ? value[0] : value;
              if (typeof padding === "number") update({ padding });
            }}
            className="py-2"
          />
        </Section>

        <Section title="Show">
          <div className="flex flex-col gap-3">
            <SwitchRow
              label="Titles under covers"
              checked={options.showTitles}
              onChange={(showTitles) => update({ showTitles })}
            />
            <SwitchRow
              label="Empty tiers"
              checked={options.showEmptyTiers}
              onChange={(showEmptyTiers) => update({ showEmptyTiers })}
            />
            <SwitchRow
              label="Unranked pool"
              checked={options.showUnranked}
              onChange={(showUnranked) => update({ showUnranked })}
            />
            <SwitchRow
              label="Count and date"
              checked={options.showDetails}
              onChange={(showDetails) => update({ showDetails })}
            />
            <SwitchRow
              label="rankd mark"
              checked={options.showWatermark}
              onChange={(showWatermark) => update({ showWatermark })}
            />
          </div>
        </Section>

        <Section
          title="Size"
          aside={
            <span className="text-xs text-muted-foreground tabular-nums">
              {outputWidth} × {outputHeight || "…"} px
            </span>
          }
        >
          <ToggleGroup
            aria-label="Export size"
            value={[String(options.scale)]}
            onValueChange={(value) => {
              const next = Number(value[0]) as ShareScale;
              if (SHARE_SCALES.includes(next)) update({ scale: next });
            }}
            spacing={0}
            className="w-full rounded-lg border bg-background p-0.5"
          >
            {SHARE_SCALES.map((scale) => (
              <ToggleGroupItem
                key={scale}
                value={String(scale)}
                size="sm"
                className="flex-1 rounded-md! text-muted-foreground aria-pressed:bg-foreground aria-pressed:text-background hover:aria-pressed:bg-foreground"
              >
                {scale}x
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Section>

        <div className="flex flex-col gap-2 border-t pt-5">
          <Button size="lg" onClick={download} disabled={!ready || busy !== null}>
            {busy === "download" ? <Loader2 className="animate-spin" /> : <Download />}
            Download PNG
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={copy}
              disabled={!ready || busy !== null}
            >
              {busy === "copy" ? <Loader2 className="animate-spin" /> : <Copy />}
              Copy
            </Button>
            {canShare && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={share}
                disabled={!ready || busy !== null}
              >
                {busy === "share" ? <Loader2 className="animate-spin" /> : <Share />}
                Share
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Shows the full-size card scaled down to fit the available width and the viewport height. */
function Preview({
  width,
  height,
  loading,
  children,
}: {
  width: number;
  height: number;
  loading: boolean;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const boxWidth = useElementWidth(boxRef);
  const viewportHeight = useViewportHeight();
  const maxHeight = Math.max(360, viewportHeight - 180);
  const scale = boxWidth && height ? Math.min(boxWidth / width, maxHeight / height, 1) : 0;

  return (
    <div ref={boxRef} className="min-w-0 lg:sticky lg:top-6">
      <div
        className="relative mx-auto overflow-hidden rounded-lg shadow-2xl ring-1 ring-border"
        style={{ width: width * scale, height: height * scale || 480 }}
      >
        <div
          className={cn("absolute top-0 left-0 transition-opacity", loading && "opacity-40")}
          style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {children}
        </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading covers…
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={(next) => onChange(next)} />
    </label>
  );
}

function useElementWidth(ref: React.RefObject<HTMLElement | null>): number {
  return useElementSize(ref, "width");
}

function useElementHeight(ref: React.RefObject<HTMLElement | null>): number {
  return useElementSize(ref, "height");
}

function useElementSize(ref: React.RefObject<HTMLElement | null>, dimension: "width" | "height"): number {
  const [size, setSize] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setSize(dimension === "width" ? element.offsetWidth : element.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, dimension]);
  return size;
}

function useViewportHeight(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => window.innerHeight,
    () => 800,
  );
}

/** Whether this browser can hand a PNG to the system share sheet (phones, Safari). */
function useCanShareFiles(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      canShareFiles ??= probeFileSharing();
      return canShareFiles;
    },
    () => false,
  );
}

let canShareFiles: boolean | undefined;

function probeFileSharing(): boolean {
  try {
    return navigator.canShare?.({ files: [new File([""], "test.png", { type: "image/png" })] }) ?? false;
  } catch {
    return false;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
