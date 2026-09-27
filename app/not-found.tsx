import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-primary">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Nothing ranked here.</h1>
      <Link href="/" className={`${buttonVariants({ variant: "outline", size: "lg" })} mt-6`}>
        Back to all lists
      </Link>
    </div>
  );
}
