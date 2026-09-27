/**
 * Cover images for the share export. Everything is turned into a data URL
 * first, so capturing the card never trips over another site's CORS rules and
 * the image is complete the moment it's rendered.
 */

/** Open Library serves several sizes; the export wants the large one. */
export function hiResCoverUrl(url: string): string {
  return url.replace(/^(https:\/\/covers\.openlibrary\.org\/.+)-[SM]\.jpg$/i, "$1-L.jpg");
}

/** A cover as a data URL, fetched through rankd's image proxy. Undefined if it can't be loaded. */
export async function inlineCover(src: string): Promise<string | undefined> {
  if (src.startsWith("data:image/")) return src;
  const candidates = [...new Set([hiResCoverUrl(src), src])];
  for (const url of candidates) {
    try {
      const response = await fetch(`/api/image?url=${encodeURIComponent(url)}`);
      if (response.ok) return await blobToDataUrl(await response.blob());
    } catch {
      // Try the next candidate.
    }
  }
  return undefined;
}

/**
 * A soft, blurred mosaic of the covers for the collage background. Drawing the
 * covers onto a tiny canvas and letting CSS scale it up gives the blur for free
 * and works in every browser.
 */
export async function coverCollage(covers: string[]): Promise<string | undefined> {
  if (covers.length === 0) return undefined;
  const images = (
    await Promise.all(
      covers.slice(0, 12).map(async (src) => {
        const image = new Image();
        image.src = src;
        try {
          await image.decode();
          return image;
        } catch {
          return null;
        }
      }),
    )
  ).filter((image): image is HTMLImageElement => image !== null);
  if (images.length === 0) return undefined;

  const columns = 3;
  const rows = 4;
  const cell = { width: 8, height: 12 };
  const small = document.createElement("canvas");
  small.width = columns * cell.width;
  small.height = rows * cell.height;
  const context = small.getContext("2d");
  if (!context) return undefined;
  for (let index = 0; index < columns * rows; index += 1) {
    const image = images[index % images.length];
    const x = (index % columns) * cell.width;
    const y = Math.floor(index / columns) * cell.height;
    context.drawImage(image, x, y, cell.width, cell.height);
  }

  // Upscale in two smoothed steps so the result reads as a blur, not as blocks.
  const large = document.createElement("canvas");
  large.width = small.width * 12;
  large.height = small.height * 12;
  const largeContext = large.getContext("2d");
  if (!largeContext) return undefined;
  largeContext.imageSmoothingEnabled = true;
  largeContext.imageSmoothingQuality = "high";
  largeContext.filter = "blur(18px) saturate(1.3)";
  largeContext.drawImage(small, -24, -24, large.width + 48, large.height + 48);
  return large.toDataURL("image/jpeg", 0.85);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
