import { useEffect, useState, type RefObject } from "react";
import type { PortalPos } from "./types";
import { clamp } from "./utils";

export function usePortalPos(open: boolean, btnRef: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState<PortalPos>(null);

  useEffect(() => {
    if (!open) return;

    let raf = 0;

    const calc = () => {
      const btn = btnRef.current;
      if (!btn) {
        setPos(null);
        return;
      }

      const r = btn.getBoundingClientRect();
      const margin = 8;

      const below = window.innerHeight - r.bottom - margin;
      const above = r.top - margin;

      const wantUp = below < 220 && above > below;
      const maxHeight = Math.max(120, Math.min(320, wantUp ? above : below));

      const rawLeft = r.left;
      const maxLeft = Math.max(margin, window.innerWidth - r.width - margin);
      const left = clamp(rawLeft, margin, maxLeft);
      const width = Math.min(r.width, window.innerWidth - margin * 2);

      if (wantUp) {
        setPos({
          left,
          width,
          bottom: window.innerHeight - r.top + margin,
          maxHeight,
        });
      } else {
        setPos({
          left,
          width,
          top: r.bottom + margin,
          maxHeight,
        });
      }
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };

    schedule();

    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [open, btnRef]);

  return pos;
}
