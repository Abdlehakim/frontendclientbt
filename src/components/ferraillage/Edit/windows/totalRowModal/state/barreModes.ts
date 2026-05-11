import type { FormeKind } from "../types";
import { getTypeDeNappeOptions } from "../config/formeBarreOptions";

export const SIMPLE_BARRE_DESIGNATIONS = [
  "Dalle pleine",
  "Chape",
  "Radier",
  "Semelles",
  "Voile",
] as const;

export const SIMPLE_BARRE_TYPES = [
  "Chaise",
  "Acier de renfort",
] as const;

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isSimpleBarreDesignation(designation: unknown) {
  const normalizedDesignation = normalizeText(designation);
  return SIMPLE_BARRE_DESIGNATIONS.some((item) => normalizeText(item) === normalizedDesignation);
}

function isSimpleBarreType(designation: unknown, typeDeNappe: unknown) {
  return (
    (getTypeDeNappeOptions(designation) as readonly unknown[]).includes(typeDeNappe) &&
    SIMPLE_BARRE_TYPES.includes(typeDeNappe as (typeof SIMPLE_BARRE_TYPES)[number])
  );
}

export function shouldUseSimpleBarreLayout({
  designation,
  forme,
  typeDeNappe,
}: {
  designation: unknown;
  forme: FormeKind | null | undefined;
  typeDeNappe: unknown;
}) {
  return isSimpleBarreDesignation(designation) && forme === "BARRE" && isSimpleBarreType(designation, typeDeNappe);
}
