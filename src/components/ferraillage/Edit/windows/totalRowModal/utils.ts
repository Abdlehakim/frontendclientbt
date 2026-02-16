import { useEffect, useState, type RefObject } from "react";
import type { FormeState } from "./types";

export function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export type PortalPos =
  | null
  | {
      left: number;
      width: number;
      top?: number;
      bottom?: number;
      maxHeight: number;
    };

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

export function parsePositiveNumber(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const v = Number(s.replace(",", "."));
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

export function parsePositiveInt(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const v = Math.floor(Number(s));
  if (!Number.isFinite(v) || v <= 0) return null;
  return v;
}

export function parseNonNegativeNumber(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const v = Number(s.replace(",", "."));
  if (!Number.isFinite(v) || v < 0) return null;
  return v;
}

export function parseNonNegativeInt(raw: string) {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const v = Math.floor(Number(s));
  if (!Number.isFinite(v) || v < 0) return null;
  return v;
}

export function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formeNeedsParams(f: FormeState["forme"]) {
  return f === "CARRE" || f === "CIRCULAIRE" || f === "RECTANGULAIRE";
}

export function formeValid(
  f: FormeState["forme"],
  nBarreStr: string,
  longueurStr: string,
  largeurStr: string,
  rayonStr: string,
) {
  const okBarre = f !== "BARRE" ? true : parsePositiveInt(nBarreStr) != null;
  const okCarre = f !== "CARRE" ? true : parsePositiveNumber(longueurStr) != null;
  const okRect = f !== "RECTANGULAIRE" ? true : parsePositiveNumber(longueurStr) != null && parsePositiveNumber(largeurStr) != null;
  const okCirc = f !== "CIRCULAIRE" ? true : parsePositiveNumber(rayonStr) != null;
  return okBarre && okCarre && okRect && okCirc;
}

export function resetFieldsForForme(
  next: FormeState["forme"],
  s: Pick<FormeState, "nBarreStr" | "longueurStr" | "largeurStr" | "rayonStr" | "attenteStr" | "perimetreStr" | "espacementStr">,
) {
  if (next === "BARRE") {
    return {
      ...s,
      longueurStr: "0",
      largeurStr: "0",
      rayonStr: "0",
      perimetreStr: "0",
      espacementStr: "0",
    };
  }

  if (next === "CARRE") {
    return { ...s, nBarreStr: "0", largeurStr: "0", rayonStr: "0", attenteStr: "0" };
  }

  if (next === "RECTANGULAIRE") {
    return { ...s, nBarreStr: "0", rayonStr: "0", attenteStr: "0" };
  }

  return { ...s, nBarreStr: "0", longueurStr: "0", largeurStr: "0", attenteStr: "0" };
}
