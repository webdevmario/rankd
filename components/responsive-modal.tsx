"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /**
   * Focus the first field on open. On phones this is skipped unless asked for,
   * so editing doesn't throw the keyboard up over the form.
   */
  autoFocus?: boolean;
  children: ReactNode;
}

/** shadcn's responsive dialog: a centred Dialog from `sm` up, a swipe-to-dismiss bottom Drawer below. */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  autoFocus = false,
  children,
}: ResponsiveModalProps) {
  const desktop = useMediaQuery("(min-width: 640px)");

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={(next) => onOpenChange(next)}>
        <DialogContent className="max-h-[85dvh] gap-5 overflow-y-auto p-6 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(next) => onOpenChange(next)} showSwipeHandle>
      <DrawerContent initialFocus={autoFocus}>
        <DrawerHeader className="px-5 text-left">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
