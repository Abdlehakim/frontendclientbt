import { useEffect } from "react";
import { computeSlabCountFromSpacing } from "../calculations/slabCalculations";
import type { FormeState } from "../types";

export function useSemelleSpacingCountSync({
  x,
  isSemelle,
  isChaise,
  semelleEqualSharedActive,
  semelleEqualDualActive,
  semelleDiffSharedActive,
  semelleDiffDualActive,
  onPatch,
}: {
  x: FormeState;
  isSemelle: boolean;
  isChaise: boolean;
  semelleEqualSharedActive: boolean;
  semelleEqualDualActive: boolean;
  semelleDiffSharedActive: boolean;
  semelleDiffDualActive: boolean;
  onPatch: (patch: Partial<FormeState>) => void;
}) {
  useEffect(() => {
    if (!isSemelle || isChaise) return;
    if (x.slabSpacingMode !== "ESPACEMENT") return;

    const spacingRelation = x.slabSpacingRelation === "EA_NE_EB" ? "EA_NE_EB" : "EA_EQ_EB";
    const lengthAStr = x.semelleLongueurAStr ?? "0";
    const lengthBStr =
      semelleEqualSharedActive || semelleEqualDualActive
        ? lengthAStr
        : (x.semelleLongueurBStr ?? "0");
    const spacingAStr = x.slabEspacementAStr ?? "0";
    const spacingBStr = spacingRelation === "EA_NE_EB" ? (x.slabEspacementBStr ?? "0") : spacingAStr;

    const countA = computeSlabCountFromSpacing(lengthAStr, spacingAStr);
    const countB = computeSlabCountFromSpacing(lengthBStr, spacingBStr);
    const patch: Partial<FormeState> = {};

    if (semelleEqualSharedActive || semelleDiffSharedActive) {
      const nextSharedCount = String(countA + countB);
      if (x.nBarreStr !== nextSharedCount) patch.nBarreStr = nextSharedCount;
    }

    if (semelleEqualDualActive || semelleDiffDualActive) {
      const nextCountA = String(countA);
      const nextCountB = String(countB);

      if (x.semelleNBarreAStr !== nextCountA) patch.semelleNBarreAStr = nextCountA;
      if (x.semelleNBarreBStr !== nextCountB) patch.semelleNBarreBStr = nextCountB;
    }

    if (Object.keys(patch).length > 0) onPatch(patch);
  }, [
    isSemelle,
    isChaise,
    semelleEqualSharedActive,
    semelleEqualDualActive,
    semelleDiffSharedActive,
    semelleDiffDualActive,
    x.slabSpacingMode,
    x.slabSpacingRelation,
    x.slabEspacementAStr,
    x.slabEspacementBStr,
    x.semelleLongueurAStr,
    x.semelleLongueurBStr,
    x.nBarreStr,
    x.semelleNBarreAStr,
    x.semelleNBarreBStr,
    onPatch,
  ]);
}
