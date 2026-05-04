import type { ExtraBoxKind, ExtraBoxState, TotalRowModalPayload } from "../types";
import { makeId } from "../utils";
import { asExtraCalcMode, asFiniteNumber, asString } from "./guards";

export function createExtraBoxState(
  kind: ExtraBoxKind,
  fallbackDia: number,
  source?: Partial<ExtraBoxState> & { id?: string },
): ExtraBoxState {
  return {
    id: typeof source?.id === "string" ? source.id : makeId(),
    kind,
    diametreMm: asFiniteNumber(source?.diametreMm, fallbackDia),
    valueStr: asString(source?.valueStr),
    longueurStr: asString(source?.longueurStr),
    ancrageStr: asString(source?.ancrageStr),
    perimetreStr: asString(source?.perimetreStr),
    espacementStr: asString(source?.espacementStr),
    extraCalcMode: asExtraCalcMode(source?.extraCalcMode),
    nbExtraStr: asString(source?.nbExtraStr),
  };
}

export function mergeExtraBoxState(current: ExtraBoxState, patch: Partial<ExtraBoxState>, fallbackDia: number): ExtraBoxState {
  return createExtraBoxState(current.kind, fallbackDia, {
    ...current,
    ...patch,
    id: current.id,
  });
}

export function buildInitialExtraBoxes(
  shouldHydrate: boolean,
  initial: Partial<TotalRowModalPayload> | undefined,
  initDia: number,
): ExtraBoxState[] {
  if (!shouldHydrate) return [];

  if (Array.isArray(initial?.extraBoxes) && initial.extraBoxes.length) {
    return initial.extraBoxes.map((b) =>
      createExtraBoxState(b.kind, initDia, {
        diametreMm: typeof b.diametreMm === "number" ? b.diametreMm : initDia,
        valueStr: b.n == null ? "0" : String(b.n),
        longueurStr: b.longueur == null ? "0" : String(b.longueur),
        ancrageStr: b.ancrage == null ? "0" : String(b.ancrage),
        perimetreStr: b.perimetre == null ? "0" : String(b.perimetre),
        espacementStr: b.espacement == null ? "0" : String(b.espacement),
        extraCalcMode: "ESPACEMENT",
        nbExtraStr: "0",
      }),
    );
  }

  const out: ExtraBoxState[] = [];

  if (initial?.epingle != null) {
    out.push(
      createExtraBoxState("EPINGLE", initDia, {
        valueStr: String(initial.epingle ?? 0),
      }),
    );
  }

  if (initial?.etriers != null) {
    out.push(
      createExtraBoxState("ETRIERS", initDia, {
        valueStr: String(initial.etriers ?? 0),
      }),
    );
  }

  return out;
}

