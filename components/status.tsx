import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function SkeletonRows({ count = 3, tall = false }: { count?: number; tall?: boolean }) {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn("animate-pulse rounded-xl border border-line bg-surface", tall ? "h-28" : "h-16")}
        />
      ))}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong loading your lists." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger" role="alert">
      {message} Check the browser console for details.
    </div>
  );
}

export function ListNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <p className="font-semibold">That list doesn&apos;t exist.</p>
      <p className="mt-1.5 text-sm text-muted">It may have been deleted, or it lives in another browser.</p>
      <Link href="/" className={cn(buttonClasses("secondary"), "mt-6")}>
        Back to all lists
      </Link>
    </div>
  );
}
