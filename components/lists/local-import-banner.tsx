"use client";

import { HardDriveUpload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getListService } from "@/lib/lists";
import { markLocalListsHandled, readLocalLists } from "@/lib/storage";
import type { List } from "@/types/list";

const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Offers, once per browser, to copy lists saved in this browser (from before
 * the database) into Postgres. Import from the device with the latest edits;
 * skipping leaves the local copy where it is.
 */
export function LocalImportBanner({ onImported }: { onImported: () => void }) {
  const [lists, setLists] = useState<List[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLists(readLocalLists());
  }, []);

  if (lists.length === 0) return null;

  async function handleImport() {
    setPending(true);
    try {
      for (const list of lists) await getListService().importList(list);
      markLocalListsHandled();
      setLists([]);
      toast.success(`Imported ${lists.length} ${lists.length === 1 ? "list" : "lists"}.`);
      onImported();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't import. Nothing was lost; try again.");
      setPending(false);
    }
  }

  function handleSkip() {
    markLocalListsHandled();
    setLists([]);
  }

  return (
    <Alert className="mb-6">
      <HardDriveUpload />
      <AlertTitle>This browser has lists saved from before sync</AlertTitle>
      <AlertDescription>
        <p>
          Import them so they show up on every device. Only import from the device with your latest changes,
          and skip on the others.
        </p>
        <ul className="mt-2 grid gap-1 text-foreground">
          {lists.map((list) => (
            <li key={list.id}>
              {list.title}{" "}
              <span className="text-muted-foreground">
                ({list.items.length} {list.items.length === 1 ? "item" : "items"}, last changed{" "}
                {dateFormat.format(new Date(list.updatedAt))})
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <Button onClick={handleImport} disabled={pending}>
            {pending ? "Importing..." : "Import"}
          </Button>
          <Button variant="ghost" onClick={handleSkip} disabled={pending}>
            Skip on this device
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
