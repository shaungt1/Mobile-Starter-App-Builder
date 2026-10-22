/**
 * Explore screen: a list whose rows can be swiped left to reveal an action,
 * showing how touch gestures (@use-gesture/react) and animation (Motion) work
 * together. Replace the sample items with real data.
 */
import { useDrag } from "@use-gesture/react";
import { Archive } from "lucide-react";
import { animate, motion, useMotionValue } from "motion/react";
import { useState } from "react";
import { Card } from "@/components/ui/card";

const REVEAL = -88;
const SAMPLE = ["Welcome guide", "Getting started", "Design tokens", "Native commands", "Release checklist"];

function SwipeRow({ title, onArchive }: { title: string; onArchive: () => void }) {
  const x = useMotionValue(0);
  const bind = useDrag(
    ({ down, movement: [mx], last }) => {
      const clamped = Math.min(0, Math.max(mx, REVEAL * 1.4));
      if (down) {
        x.set(clamped);
      } else if (last) {
        animate(x, clamped < REVEAL / 2 ? REVEAL : 0, { type: "spring", stiffness: 500, damping: 40 });
      }
    },
    { axis: "x", filterTaps: true },
  );
  return (
    <li className="relative overflow-hidden rounded-lg">
      <button
        aria-label={`Archive ${title}`}
        className="absolute inset-y-0 right-0 flex w-22 items-center justify-center bg-destructive text-white"
        onClick={onArchive}
        type="button"
      >
        <Archive aria-hidden className="size-5" />
      </button>
      {/* Motion moves the row; the gesture binds to a plain element inside it, so it moves too. */}
      <motion.div className="relative" style={{ x }}>
        <div {...bind()} className="touch-pan-y">
          <Card className="rounded-lg p-4">{title}</Card>
        </div>
      </motion.div>
    </li>
  );
}

export function ExplorePage() {
  const [items, setItems] = useState(SAMPLE);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-bold text-2xl">Explore</h1>
      <p className="text-muted-foreground text-sm">Swipe a row left to reveal its action.</p>
      <ul className="flex flex-col gap-2">
        {items.map((title) => (
          <SwipeRow
            key={title}
            onArchive={() => setItems((all) => all.filter((item) => item !== title))}
            title={title}
          />
        ))}
      </ul>
      {items.length === 0 && <p className="text-muted-foreground text-sm">Everything is archived.</p>}
    </div>
  );
}
