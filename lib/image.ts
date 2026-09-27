/**
 * Shrinks a picked photo to a small JPEG data URL so it can be stored with the
 * item. Covers render at most ~100px wide, so 540px on the long edge is plenty
 * for retina screens and keeps each one around 30 to 60 KB.
 */
export async function imageFileToDataUrl(file: File, maxEdge = 540, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Couldn't process the image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function isUploadedImage(value: string | undefined): boolean {
  return value?.startsWith("data:image/") ?? false;
}
