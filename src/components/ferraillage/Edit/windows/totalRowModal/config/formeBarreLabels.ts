import type {
  SlabCalcMethod,
  SlabRelation,
  SlabSpacingMode,
  SlabSpacingRelation,
} from "../types";
import type { SemelleNappe, SlabNappe, SemelleRelation } from "./formeBarreOptions";
import { safeNumber } from "../utils";

export function fmt(n: number) {
  const r = Math.round(safeNumber(n) * 1000) / 1000;
  return String(r).replace(".", ",");
}

export function isVoileDesignation(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase() === "voile";
}

export function getSlabAxisLabels(designation?: string | null) {
  const axisA = isVoileDesignation(designation) ? "L" : "a";
  const axisB = isVoileDesignation(designation) ? "H" : "b";

  return {
    axisA,
    axisB,
    relationFieldLabel: `Re. entre ${axisA} et ${axisB}`,
    lengthSharedLabel: `L. Barre ${axisA} ou ${axisB} (m)`,
    lengthALabel: `L. Barre ${axisA} (m)`,
    lengthBLabel: `L. Barre ${axisB} (m)`,
    diameterSharedLabel: `Di. ${axisA} et ${axisB}`,
    diameterALabel: `Di. Fer ${axisA}`,
    diameterBLabel: `Di. Fer ${axisB}`,
    spacingSharedLabel: `Es. ${axisA} et ${axisB}`,
    spacingALabel: `Es. ${axisA}`,
    spacingBLabel: `Es. ${axisB}`,
    countSharedLabel: `Nb. Barres ${axisA} et ${axisB}`,
    countALabel: `Nb. Barres ${axisA}`,
    countBLabel: `Nb. Barres ${axisB}`,
    ntParallelALabel: `N.T.B façonnées ∥ ${axisA}`,
    ntParallelBLabel: `N.T.B façonnées ∥ ${axisB}`,
    pairTitleA: `(${axisA})`,
    pairTitleB: `(${axisB})`,
  };
}

export function getNappeLabel(value: SemelleNappe | SlabNappe) {
  switch (value) {
    case "Nappe inférieur":
      return "Nappe inférieure";
    case "Nappe supérieur":
      return "Nappe supérieure";
    case "Chaise":
      return "Chaise";
    case "Acier de renfort":
      return "Acier de renfort";
    default:
      return value;
  }
}

export function getSemelleRelationLabel(v: SemelleRelation) {
  switch (v) {
    case "ab_equal_same_if":
      return "a = b et if.a = if.b";
    case "ab_equal_diff_if":
      return "a = b et if.a ≠ if.b";
    case "ab_diff_same_if":
      return "a ≠ b et if.a = if.b";
    case "ab_diff_diff_if":
      return "a ≠ b et if.a ≠ if.b";
    default:
      return v;
  }
}

export function getSlabRelationLabel(v: SlabRelation, designation?: string | null) {
  const { axisA, axisB } = getSlabAxisLabels(designation);

  switch (v) {
    case "ab_equal_same_if":
      return `${axisA} = ${axisB} et if.${axisA} = if.${axisB}`;
    case "ab_equal_diff_if":
      return `${axisA} = ${axisB} et if.${axisA} ≠ if.${axisB}`;
    case "ab_diff_same_if":
      return `${axisA} ≠ ${axisB} et if.${axisA} = if.${axisB}`;
    case "ab_diff_diff_if":
      return `${axisA} ≠ ${axisB} et if.${axisA} ≠ if.${axisB}`;
    default:
      return v;
  }
}

export function getSlabCalcMethodLabel(v: SlabCalcMethod) {
  switch (v) {
    case "SURFACE_TOTAL":
      return "Surface totale";
    case "SURFACE_TOTAL_PER_M2":
      return "Surface totale / m²";
    default:
      return v;
  }
}

export function getSlabSpacingModeLabel(v: SlabSpacingMode) {
  switch (v) {
    case "ESPACEMENT":
      return "Espacement";
    case "NB_CADRE":
      return "Nb. Barres";
    default:
      return v;
  }
}

export function getSlabSpacingRelationLabel(v: SlabSpacingRelation, designation?: string | null) {
  const { axisA, axisB } = getSlabAxisLabels(designation);

  switch (v) {
    case "EA_EQ_EB":
      return `E ${axisA} = E ${axisB}`;
    case "EA_NE_EB":
      return `E ${axisA} ≠ E ${axisB}`;
    default:
      return v;
  }
}

export function formatDiametreLabel(mm: number | null | undefined) {
  if (typeof mm !== "number" || !Number.isFinite(mm) || mm <= 0) return "";
  return String(mm).replace(".", ",");
}

export function getDualDiameterResultLabels(
  diaLabelA: string,
  diaLabelB: string,
  designation?: string | null,
) {
  const { axisA, axisB } = getSlabAxisLabels(designation);
  const sameDiameter = !!diaLabelA && !!diaLabelB && diaLabelA === diaLabelB;

  if (sameDiameter) {
    return {
      qteLabelA: `Q. Fer ${axisA} - Fer ${diaLabelA} (m)`,
      qteLabelB: `Q. Fer ${axisB} - Fer ${diaLabelB} (m)`,
      ntLabelA: `N.T.B façonnées ${axisA} - Fer ${diaLabelA}`,
      ntLabelB: `N.T.B façonnées ${axisB} - Fer ${diaLabelB}`,
    };
  }

  return {
    qteLabelA: diaLabelA ? `Q. Fer ${diaLabelA} (m)` : `Q. Fer ${axisA} (m)`,
    qteLabelB: diaLabelB ? `Q. Fer ${diaLabelB} (m)` : `Q. Fer ${axisB} (m)`,
    ntLabelA: diaLabelA ? `N.T.B façonnées ${diaLabelA}` : `N.T.B façonnées ${axisA}`,
    ntLabelB: diaLabelB ? `N.T.B façonnées ${diaLabelB}` : `N.T.B façonnées ${axisB}`,
  };
}
