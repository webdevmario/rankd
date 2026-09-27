import type { ReactNode } from "react";

export const inputClasses =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-white outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent/70 focus:ring-2 focus:ring-accent/20";

interface FieldProps {
  label: string;
  htmlFor: string;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, optional, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-2 text-xs font-medium text-muted">
        {label}
        {optional && <span className="text-faint">optional</span>}
      </label>
      {children}
    </div>
  );
}
