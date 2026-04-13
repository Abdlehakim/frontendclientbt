import type { FormeState } from "../types";
import { parsePositiveInt, parsePositiveNumber } from "../utils";
import { asSemelleRelation, asString, asTrimmedString } from "./guards";

export function isSemelleBarreValid(source: Partial<FormeState>) {
  const nappe = asTrimmedString(source.barreCategorie, "") || "Nappe inférieure";

  if (nappe === "Chaise") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.longueurStr)) != null
    );
  }

  const relation = asSemelleRelation(source.semelleRelation);

  if (relation === "ab_equal_same_if") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null
    );
  }

  if (relation === "ab_equal_diff_if") {
    return (
      parsePositiveInt(asString(source.semelleNBarreAStr)) != null &&
      parsePositiveInt(asString(source.semelleNBarreBStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null
    );
  }

  if (relation === "ab_diff_same_if") {
    return (
      parsePositiveInt(asString(source.nBarreStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurAStr)) != null &&
      parsePositiveNumber(asString(source.semelleLongueurBStr)) != null
    );
  }

  return (
    parsePositiveInt(asString(source.semelleNBarreAStr)) != null &&
    parsePositiveInt(asString(source.semelleNBarreBStr)) != null &&
    parsePositiveNumber(asString(source.semelleLongueurAStr)) != null &&
    parsePositiveNumber(asString(source.semelleLongueurBStr)) != null
  );
}

export function isSlabBarreValid(source: Partial<FormeState>) {
  const surface = parsePositiveNumber(asString(source.slabSurfaceStr));
  if (surface == null) return false;

  const calcMethod = source.slabCalcMethod === "SURFACE_TOTAL_PER_M2" ? "SURFACE_TOTAL_PER_M2" : "SURFACE_TOTAL";
  if (calcMethod === "SURFACE_TOTAL_PER_M2") {
    return parsePositiveNumber(asString(source.slabQtePerM2Str)) != null;
  }

  return true;
}

