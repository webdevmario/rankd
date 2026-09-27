import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SkeletonRows({ count = 3, tall = false }: { count?: number; tall?: boolean }) {
  return (
    <div className="grid gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={cn("rounded-xl", tall ? "h-28" : "h-16")} />
      ))}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong loading your lists." }: { message?: string }) {
  return (
    <div
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
      role="alert"
    >
      {message} Check the browser console for details.
    </div>
  );
}

export function ListNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <p className="font-semibold">That list doesn&apos;t exist.</p>
      <p className="mt-1.5 text-sm text-muted-foreground">It may have been deleted.</p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-6")}>
        Back to all lists
      </Link>
    </div>
  );
}
