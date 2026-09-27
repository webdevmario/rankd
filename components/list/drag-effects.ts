"use client";

import {
  defaultDropAnimationSideEffects,
  type DropAnimation,
  type KeyboardCoordinateGetter,
  type Modifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useReducedMotion } from "framer-motion";

/**
 * Shared drag-overlay polish for every ranking view.
 *
 * Use with `<DragOverlay adjustScale modifiers={[liftModifier(…)]} style={OVERLAY_STYLE}>`.
 * The overlay's transform-origin is its top-left corner so dnd-kit's drop
 * animation lands exactly; the modifier offsets by half the growth to keep the
 * scale visually centred.
 */
export const OVERLAY_STYLE = { transformOrigin: "0 0" } as const;

export function liftModifier(scale: number): Modifier {
  return ({ transform, activeNodeRect }) => {
    if (!activeNodeRect) return transform;
    return {
      ...transform,
      x: transform.x - (activeNodeRect.width * (scale - 1)) / 2,
      y: transform.y - (activeNodeRect.height * (scale - 1)) / 2,
      scaleX: scale,
      scaleY: scale,
    };
  };
}

/**
 * `sortableKeyboardCoordinates`, but fed the card's un-lifted rect. dnd-kit
 * measures the scaled overlay, so its top edge sits a few px above same-row
 * neighbours and "down" would pick a card beside it instead of the next row.
 */
export function unliftedKeyboardCoordinates(scale: number): KeyboardCoordinateGetter {
  return (event, args) => {
    const rect = args.context.collisionRect;
    if (!rect) return sortableKeyboardCoordinates(event, args);
    const width = rect.width / scale;
    const height = rect.height / scale;
    const left = rect.left + (rect.width - width) / 2;
    const top = rect.top + (rect.height - height) / 2;
    const collisionRect = { width, height, left, top, right: left + width, bottom: top + height };
    return sortableKeyboardCoordinates(event, { ...args, context: { ...args.context, collisionRect } });
  };
}

/** Overshooting ease → the card springs back into its slot and the lift settles to 1. */
const springBack: DropAnimation = {
  duration: 340,
  easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } }),
};

/** The drop animation, or none when the OS asks for reduced motion. */
export function useDropAnimation(): DropAnimation | null {
  return useReducedMotion() ? null : springBack;
}
