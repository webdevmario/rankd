"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ItemCoverProps {
  title: string;
  src?: string;
  /** Sizing and rounding for the frame; the cover fills it. */
  className?: string;
  /** Font size for the initials placeholder. */
  initialsClassName?: string;
}

/** An item's cover image, or its initials when it has none (or the image fails to load). */
export function ItemCover({ title, src, className, initialsClassName = "text-lg" }: ItemCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div className={cn("shrink-0 overflow-hidden bg-muted", className)}>
      {src && failedSrc !== src ? (
        // Covers are user-supplied URLs or uploaded data URLs, so next/image's host allowlist doesn't fit.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-linear-to-br from-neutral-800 to-neutral-950 p-1 text-center">
          <span className={cn("font-mono font-semibold text-neutral-400", initialsClassName)}>
            {initials(title)}
          </span>
        </div>
      )}
    </div>
  );
}

/** Up to two initials for a cover placeholder, skipping a leading "The", "A" or "An". */
export function initials(title: string): string {
  const words = title
    .replace(/^(the|a|an)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
}
