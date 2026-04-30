import type { FormeState } from "./types";

export function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function safeDivide(a: unknown, b: unknown) {
  const denominator = Number(b);
  if (!b || !Number.isFinite(denominator) || denominator === 0) return 0;
  return safeNumber(a) / denominator;
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
