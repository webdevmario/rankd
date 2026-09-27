"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ItemCover } from "@/components/item-cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { imageFileToDataUrl, isUploadedImage } from "@/lib/image";

interface CoverFieldProps {
  id: string;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onError: (message: string) => void;
}

/** Cover picker: upload a photo from the device (camera roll on phones) or paste an image URL. */
export function CoverField({ id, title, value, onChange, onError }: CoverFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const uploaded = isUploadedImage(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setProcessing(true);
    try {
      onChange(await imageFileToDataUrl(file));
    } catch (err) {
      console.error(err);
      onError("Couldn't read that photo. Try a JPEG or PNG.");
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex gap-3">
      <ItemCover
        key={value}
        title={title || "?"}
        src={value || undefined}
        className="aspect-[2/3] w-16 rounded-lg border"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            id={`${id}-file`}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={processing}>
            <ImagePlus />
            {processing ? "Processing..." : value ? "Replace photo" : "Upload photo"}
          </Button>
          {value && (
            <Button variant="ghost" onClick={() => onChange("")}>
              Clear photo
            </Button>
          )}
        </div>
        <Input
          id={id}
          type="url"
          inputMode="url"
          value={uploaded ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={uploaded ? "Using an uploaded photo" : "or paste an image URL"}
          autoComplete="off"
          aria-label="Cover image URL"
        />
      </div>
    </div>
  );
}
