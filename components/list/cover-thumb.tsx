"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/icons";

const frame = "h-16 w-11 shrink-0 rounded-md border border-line bg-surface-raised";

export function CoverThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${frame} flex items-center justify-center text-faint`} title="Cover failed to load">
        <ImageIcon />
      </div>
    );
  }

  return (
    // Covers are arbitrary user-supplied URLs, so next/image's host allowlist doesn't fit.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      draggable={false}
      onError={() => setFailed(true)}
      className={`${frame} object-cover`}
    />
  );
}
