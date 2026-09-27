import type { ItemSourceType } from "@/types/list";
import { ManualSource } from "./manual-source";
import type { ItemSource, SourceContext, SourceFactory } from "./types";

export type { ItemSource, SourceContext, SourceFactory } from "./types";
export { ManualSource } from "./manual-source";

/** Register new source adapters here. */
const registry: Partial<Record<ItemSourceType, SourceFactory>> = {
  manual: (context) => new ManualSource(context),
};

export const SOURCE_LABELS: Record<ItemSourceType, string> = {
  manual: "Manual",
  "stack-api": "Stack API",
  "csv-import": "CSV import",
};

export function isSourceAvailable(type: ItemSourceType): boolean {
  return type in registry;
}

export function createSource(type: ItemSourceType, context: SourceContext): ItemSource {
  const factory = registry[type];
  if (!factory) throw new Error(`No item source adapter for "${type}" yet.`);
  return factory(context);
}
