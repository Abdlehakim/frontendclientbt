import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

import type {
  Card,
  ExtraBoxKind,
  ExtraBoxState,
  FormeKind,
  FormeState,
  TotalRowModalPayload,
} from "./types";
import {
  clamp,
  formeValid,
  parseNonNegativeInt,
  parseNonNegativeNumber,
  parsePositiveInt,
  parsePositiveNumber,
} from "./utils";
import {
  ExtraBoxCard,
  FormeCard,
} from "./components";
import {
  computeDiffDualSlabSpacingRecapMetrics,
  computeDiffSharedSlabSpacingRecapMetrics,
  computeSlabQte,
  computeSpecialSlabSpacingRecapMetrics,
} from "./calculations/recapCalculations";
import {
  SLAB_COMMERCIAL_BAR_LENGTH_M,
  computeCommercialBarCount,
  computeSlabSurfacePerM2SpacingMetrics,
  computeSlabSurfacePerM2SplitMetrics,
} from "./calculations/slabCalculations";
import {
  computeCadrePerimetre,
  computeExtraPerimetre,
} from "./calculations/shapeCalculations";
import {
  formatDiametreLabel,
  getDualDiameterResultLabels,
} from "./config/formeBarreLabels";
import RecapPanel, { type RecapData } from "./components/recap/RecapPanel";
import FormeBarreAbbreviationsModal from "./components/formeBarre/FormeBarreAbbreviationsModal";
import BarreCard from "./components/modal/BarreCard";
import ModalFooter from "./components/modal/ModalFooter";
import ModalHeader from "./components/modal/ModalHeader";
import ModalTopFields from "./components/modal/ModalTopFields";
import { buildInitialOrder, insertCardAtEndOfCurrentPage } from "./state/cardOrder";
import {
  buildInitialExtraBoxes,
  createExtraBoxState,
  mergeExtraBoxState,
} from "./state/extraBoxStateFactory";
import {
  buildInitialFormes,
  createFormeState,
  mergeFormeState,
} from "./state/formeStateFactory";
import {
  asObjectRecord,
  asSemelleRelation,
  asSlabCalcMethod,
  asSlabRelation,
  asSlabSpacingMode,
  asSlabSpacingRelation,
  asString,
  asTrimmedString,
  hasAnyValue,
  isFormeKind,
  isSlabDesignationValue,
  isSlabSurfacePerM2SpacingDesignationValue,
  normalizeSlabSurfacePerM2Relation,
  normalizeDesignation,
  normalizeSlabSpacingRelationValue,
} from "./state/guards";
import { isSemelleBarreValid, isSlabBarreValid } from "./state/validators";
import { buildTotalRowModalPayload } from "./state/payloadMapper";

type ModalState = {
  extraBoxes: ExtraBoxState[];
  formes: FormeState[];
  cardOrder: Card[];
  page: number;
};

export default function TotalRowModalWindowInner({
  open,
  title,
  submitLabel,
  inputClass,
  mms,
  initial,
  onClose,
  onSubmit,
  submitting = false,
  errorMessage,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  inputClass: string;
  mms: number[];
  initial?: Partial<TotalRowModalPayload>;
  onClose: () => void;
  onSubmit: (payload: TotalRowModalPayload) => void | Promise<void>;
  submitting?: boolean;
  errorMessage?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const FORMS_PER_PAGE = 3;
  const twoColGrid = "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const safeMms = useMemo(() => {
    const arr = Array.isArray(mms) ? [...mms] : [];
    const uniq = Array.from(new Set(arr.filter((x) => Number.isFinite(x))));
    uniq.sort((a, b) => a - b);
    return uniq.length ? uniq : [6, 8, 10, 12, 14, 16, 20];
  }, [mms]);

  const initDia = useMemo(() => {
    const d = initial?.diametreMm;
    if (typeof d === "number" && safeMms.includes(d)) return d;
    return safeMms[0] ?? 6;
  }, [initial?.diametreMm, safeMms]);

  const shouldHydrate = useMemo(() => {
    const d = (initial?.designation ?? "").trim();
    const t = (initial?.typeName ?? "").trim();
    const initialRaw = asObjectRecord(initial);

    const anyNumbers =
      initial?.nb != null ||
      initial?.hauteur != null ||
      initial?.epingle != null ||
      initial?.etriers != null ||
      initial?.ancrage != null ||
      initial?.attenteBarre != null ||
      initial?.nBarre != null ||
      initial?.longueur != null ||
      initial?.largeur != null ||
      initial?.rayon != null ||
      initial?.perimetre != null ||
      initial?.espacement != null ||
      initial?.slabSurface != null ||
      initial?.slabQtePerM2 != null ||
      initial?.slabPerimetre != null ||
      initial?.slabAncrageLineaire != null;

    const anyAdvancedFormState = hasAnyValue(initialRaw, [
      "semelleRelation",
      "semelleLongueurAStr",
      "semelleLongueurBStr",
      "semelleNBarreAStr",
      "semelleNBarreBStr",
      "semelleDiametreAMm",
      "semelleDiametreBMm",
      "slabRelation",
      "slabSpacingMode",
      "slabSpacingRelation",
      "slabLongueurAStr",
      "slabLongueurBStr",
      "slabDiametreAMm",
      "slabDiametreBMm",
      "slabNBarreAStr",
      "slabNBarreBStr",
      "slabEspacementAStr",
      "slabEspacementBStr",
      "slabNbCadreAStr",
      "slabNbCadreBStr",
    ]);

    const anyExtra = (initial?.extraFormes?.length ?? 0) > 0;
    const anyExtraBoxes = (initial?.extraBoxes?.length ?? 0) > 0;

    return !!(d || t || anyNumbers || anyAdvancedFormState || anyExtra || anyExtraBoxes);
  }, [initial]);

  const [designation, setDesignation] = useState(() => initial?.designation ?? "");
  const [nomenclature, setNomenclature] = useState(() => initial?.typeName ?? "");
  const [nbStr, setNbStr] = useState(() => (initial?.nb == null ? "0" : String(initial.nb)));
  const [hauteurStr, setHauteurStr] = useState(() => (initial?.hauteur == null ? "0" : String(initial.hauteur)));
  const [showAbbreviationHelp, setShowAbbreviationHelp] = useState(false);

  const isAbbreviationHelpOpen = open && showAbbreviationHelp;

  const [st, setSt] = useState<ModalState>(() => {
    const extraBoxesInit = buildInitialExtraBoxes(shouldHydrate, initial, initDia);
    const formesInit = buildInitialFormes(shouldHydrate, initial, initDia);
    const orderInit = buildInitialOrder(extraBoxesInit, formesInit);
    return { extraBoxes: extraBoxesInit, formes: formesInit, cardOrder: orderInit, page: 1 };
  });

  const extraBoxes = st.extraBoxes;
  const formes = st.formes;
  const cards = st.cardOrder;

  const normalizedDesignation = normalizeDesignation(designation);
  const isSemellesDesignation = normalizedDesignation === "semelles";
  const isSlabDesignation = isSlabDesignationValue(designation);
  const showHauteurField = !isSlabDesignation;

  const extraMap = useMemo(() => new Map(extraBoxes.map((b) => [b.id, b] as const)), [extraBoxes]);
  const formesMap = useMemo(() => new Map(formes.map((f) => [f.id, f] as const)), [formes]);

  const extraMeta = useMemo(() => {
    const countByKind: Record<ExtraBoxKind, number> = { EPINGLE: 0, ETRIERS: 0 };
    const indexById = new Map<string, number>();

    for (const b of extraBoxes) {
      countByKind[b.kind] += 1;
      indexById.set(b.id, countByKind[b.kind]);
    }

    return { countByKind, indexById };
  }, [extraBoxes]);

  const formeMeta = useMemo(() => {
    const barreIndexById = new Map<string, number>();
    const cadreIndexById = new Map<string, number>();

    let b = 0;
    let c = 0;

    for (const f of formes) {
      if (f.forme === "BARRE") {
        b += 1;
        barreIndexById.set(f.id, b);
      } else {
        c += 1;
        cadreIndexById.set(f.id, c);
      }
    }

    return {
      totalBarres: b,
      totalCadres: c,
      barreIndexById,
      cadreIndexById,
    };
  }, [formes]);

  const barreLitIndexById = useMemo(() => {
    const tracked = new Set(["Acier inférieur", "Acier supérieur", "Chapeau"]);
    const counts = new Map<string, number>();
    const indexById = new Map<string, number>();

    for (const f of formes) {
      if (f.forme !== "BARRE") continue;

      const cat = asTrimmedString(f.barreCategorie, "");
      if (!tracked.has(cat)) continue;

      const next = (counts.get(cat) ?? 0) + 1;
      counts.set(cat, next);
      indexById.set(f.id, next);
    }

    return indexById;
  }, [formes]);

  const usesLongueurLabel = useMemo(() => {
    const v = (designation ?? "").trim().toLowerCase();
    return ["longrines", "raidisseurs", "linteaux", "chaînages", "poutres", "nervures"].includes(v);
  }, [designation]);

  const usesTopLongueurLabel = useMemo(() => {
    const v = (designation ?? "").trim().toLowerCase();
    return ["longrines", "raidisseurs", "linteaux", "chaînages", "poutres", "nervures", "semelles"].includes(v);
  }, [designation]);

  const hauteurLabel = usesTopLongueurLabel ? "Longueur (m)" : "Hauteur";
  const hauteurPlaceholder = usesTopLongueurLabel ? "Ex: 6,5" : "Ex: 2.8";

  const totalCount = cards.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / FORMS_PER_PAGE)), [totalCount]);

  const safePage = useMemo(() => clamp(st.page, 1, totalPages), [st.page, totalPages]);

  const handlePageChange = (p: number) => {
    setSt((prev) => {
      const tp = Math.max(1, Math.ceil(prev.cardOrder.length / FORMS_PER_PAGE));
      return { ...prev, page: clamp(p, 1, tp) };
    });
  };

  const pageStart = (safePage - 1) * FORMS_PER_PAGE;
  const visibleCards = cards.slice(pageStart, pageStart + FORMS_PER_PAGE);

  const addExtraBox = (kind: ExtraBoxKind) => {
    const nextBox = createExtraBoxState(kind, initDia);

    setSt((prev) => {
      const nextBoxes = [...prev.extraBoxes, nextBox];
      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, {
        kind: "EXTRA",
        id: nextBox.id,
      });

      return {
        ...prev,
        extraBoxes: nextBoxes,
        cardOrder: nextOrder,
        page: nextPage,
      };
    });
  };

  const updateExtraBox = (id: string, patch: Partial<ExtraBoxState>) => {
    setSt((prev) => ({
      ...prev,
      extraBoxes: prev.extraBoxes.map((b) => (b.id === id ? mergeExtraBoxState(b, patch, initDia) : b)),
    }));
  };

  const removeExtraBox = (id: string) => {
    setSt((prev) => {
      const nextBoxes = prev.extraBoxes.filter((b) => b.id !== id);
      const nextOrder = prev.cardOrder.filter((c) => !(c.kind === "EXTRA" && c.id === id));
      const tp = Math.max(1, Math.ceil(nextOrder.length / FORMS_PER_PAGE));

      return {
        ...prev,
        extraBoxes: nextBoxes,
        cardOrder: nextOrder,
        page: clamp(prev.page, 1, tp),
      };
    });
  };

  const updateForme = (id: string, patch: Partial<FormeState>) => {
    setSt((prev) => ({
      ...prev,
      formes: prev.formes.map((x) => (x.id === id ? mergeFormeState(x, patch, initDia) : x)),
    }));
  };

  const setFormeSafe = (id: string, next: FormeKind) => {
    setSt((prev) => ({
      ...prev,
      formes: prev.formes.map((x) => (x.id === id ? mergeFormeState(x, { forme: next }, initDia) : x)),
    }));
  };

  const removeForme = (id: string) => {
    setSt((prev) => {
      const nextFormes = prev.formes.filter((x) => x.id !== id);
      const nextOrder = prev.cardOrder.filter((c) => !(c.kind === "FORME" && c.id === id));
      const tp = Math.max(1, Math.ceil(nextOrder.length / FORMS_PER_PAGE));

      return {
        ...prev,
        formes: nextFormes,
        cardOrder: nextOrder,
        page: clamp(prev.page, 1, tp),
      };
    });
  };

  const addCadre = () => {
    setSt((prev) => {
      const last = prev.formes[prev.formes.length - 1];
      const nextForme: FormeKind = last && last.forme !== "BARRE" && isFormeKind(last.forme) ? last.forme : "CARRE";
      const nextItem = createFormeState(nextForme, initDia, {
        diametreMm:
          typeof last?.diametreMm === "number" && Number.isFinite(last.diametreMm) ? last.diametreMm : initDia,
      });

      const nextFormes = [...prev.formes, nextItem];
      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, {
        kind: "FORME",
        id: nextItem.id,
      });

      return {
        ...prev,
        formes: nextFormes,
        cardOrder: nextOrder,
        page: nextPage,
      };
    });
  };

  const addBarre = () => {
    setSt((prev) => {
      const nextItem = createFormeState("BARRE", initDia);
      const nextFormes = [...prev.formes, nextItem];

      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, {
        kind: "FORME",
        id: nextItem.id,
      });

      return {
        ...prev,
        formes: nextFormes,
        cardOrder: nextOrder,
        page: nextPage,
      };
    });
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const closeOnBackdrop = (ev: ReactMouseEvent<HTMLDivElement>) => {
    if (submitting) return;
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  const designationOk = (designation ?? "").trim().length > 0;
  const formesOk =
    formes.length > 0 &&
    formes.every((x) => {
      const forme = isFormeKind(x.forme) ? x.forme : "BARRE";

      if (forme === "BARRE" && isSemellesDesignation) {
        return isSemelleBarreValid(x);
      }

      if (forme === "BARRE" && isSlabDesignation) {
        return isSlabBarreValid(x, {
          isSlabSurfacePerM2SpacingDesignation:
            isSlabSurfacePerM2SpacingDesignationValue(designation),
        });
      }

      return formeValid(
        forme,
        asString(x.nBarreStr),
        asString(x.longueurStr),
        asString(x.largeurStr),
        asString(x.rayonStr),
      );
    });

  const canSubmit = designationOk && formesOk;

  const recap: RecapData = useMemo(() => {
    const nb = parsePositiveInt(nbStr) ?? 0;
    const h = showHauteurField ? parsePositiveNumber(hauteurStr) ?? 0 : 0;
    const isSemellesDesignationInner = normalizeDesignation(designation) === "semelles";
    const isSlabDesignationInner = isSlabDesignationValue(designation);
    const isSlabSurfacePerM2SpacingDesignationInner =
      isSlabSurfacePerM2SpacingDesignationValue(designation);

    const linesCadres: RecapData["linesCadres"] = [];
    const linesBarres: RecapData["linesBarres"] = [];
    const linesExtras: RecapData["linesExtras"] = [];

    const qtyByDia = new Map<number, number>();

    const addQty = (dia: number | null, qtyM: number) => {
      if (dia == null) return;
      if (!Number.isFinite(qtyM)) return;
      qtyByDia.set(dia, (qtyByDia.get(dia) ?? 0) + qtyM);
    };

    for (const f of formes) {
      const forme = isFormeKind(f.forme) ? f.forme : "BARRE";
      const dia = typeof f.diametreMm === "number" && Number.isFinite(f.diametreMm) ? f.diametreMm : initDia;

      if (forme === "BARRE") {
        if (isSlabDesignationInner) {
          const calcMethod = asSlabCalcMethod(f.slabCalcMethod);
          const relation = asSlabRelation(f.slabRelation);
          const spacingMode = asSlabSpacingMode(f.slabSpacingMode);
          const spacingRelation = asSlabSpacingRelation(f.slabSpacingRelation);
          const normalizedSpacingRelation = normalizeSlabSpacingRelationValue(spacingRelation);
          const steelType = asTrimmedString(f.barreCategorie, "") || undefined;

          if (
            isSlabSurfacePerM2SpacingDesignationInner &&
            calcMethod === "SURFACE_TOTAL_PER_M2"
          ) {
            const dallePleinePerM2Metrics = computeSlabSurfacePerM2SpacingMetrics({
              surfaceStr: asString(f.slabSurfaceStr),
              perimetreStr: asString(f.slabPerimetreStr),
              ancrageLineaireStr: asString(f.slabAncrageLineaireStr),
              spacingRelation,
              spacingAStr: asString(f.slabEspacementAStr),
              spacingBStr: asString(f.slabEspacementBStr),
            });
            const dallePleineRelation = normalizeSlabSurfacePerM2Relation(f.slabRelation);
            const totalQtyM = dallePleinePerM2Metrics.qtyM * nb;
            const safeTotalQtyM = totalQtyM > 0 ? totalQtyM : 0;
            const totalNt = computeCommercialBarCount(totalQtyM, SLAB_COMMERCIAL_BAR_LENGTH_M);

            if (dallePleineRelation === "ab_equal_diff_if") {
              const diaA =
                typeof f.slabDiametreAMm === "number" && Number.isFinite(f.slabDiametreAMm)
                  ? f.slabDiametreAMm
                  : dia;
              const diaB =
                typeof f.slabDiametreBMm === "number" && Number.isFinite(f.slabDiametreBMm)
                  ? f.slabDiametreBMm
                  : dia;
              const dualNtLabels = getDualDiameterResultLabels(
                formatDiametreLabel(diaA),
                formatDiametreLabel(diaB),
              );
              const splitMetrics = computeSlabSurfacePerM2SplitMetrics({
                qA: dallePleinePerM2Metrics.qA,
                qB: dallePleinePerM2Metrics.qB,
                ancrageM: dallePleinePerM2Metrics.ancrageM,
                multiplier: nb,
                commercialBarLengthM: dallePleinePerM2Metrics.cutLenM,
              });

              linesBarres.push({
                key: `${f.id}:a`,
                label: dualNtLabels.ntLabelA,
                dia: diaA,
                qtyM: splitMetrics.qtyA > 0 ? splitMetrics.qtyA : 0,
                nt: splitMetrics.ntA > 0 ? splitMetrics.ntA : 0,
                cutLenM: splitMetrics.cutLenM,
                steelType,
              litLabel: "Surface totale / m²",
              });

              linesBarres.push({
                key: `${f.id}:b`,
                label: dualNtLabels.ntLabelB,
                dia: diaB,
                qtyM: splitMetrics.qtyB > 0 ? splitMetrics.qtyB : 0,
                nt: splitMetrics.ntB > 0 ? splitMetrics.ntB : 0,
                cutLenM: splitMetrics.cutLenM,
                steelType,
                litLabel: "Surface totale / m²",
              });

              addQty(diaA, splitMetrics.qtyA > 0 ? splitMetrics.qtyA : 0);
              addQty(diaB, splitMetrics.qtyB > 0 ? splitMetrics.qtyB : 0);
              continue;
            }

            linesBarres.push({
              key: f.id,
              label: "N.T.Barre",
              dia,
              qtyM: safeTotalQtyM,
              nt: totalNt,
              cutLenM: dallePleinePerM2Metrics.cutLenM > 0 ? dallePleinePerM2Metrics.cutLenM : 0,
              steelType,
                litLabel: "Surface totale / m²",
            });

            addQty(dia, safeTotalQtyM);
            continue;
          }

          const diffDualSpacingMetrics = computeDiffDualSlabSpacingRecapMetrics({
            nbStr,
            longueurAStr: asString(f.slabLongueurAStr),
            longueurBStr: asString(f.slabLongueurBStr),
            ancrageStr: asString(f.ancrageStr),
            spacingMode,
            spacingRelation: normalizedSpacingRelation,
            calcMethod,
            relation,
            spacingAStr: asString(f.slabEspacementAStr),
            spacingBStr: asString(f.slabEspacementBStr),
          });

          if (diffDualSpacingMetrics) {
            const diaA =
              typeof f.slabDiametreAMm === "number" && Number.isFinite(f.slabDiametreAMm)
                ? f.slabDiametreAMm
                : dia;
            const diaB =
              typeof f.slabDiametreBMm === "number" && Number.isFinite(f.slabDiametreBMm)
                ? f.slabDiametreBMm
                : dia;
            const dualNtLabels = getDualDiameterResultLabels(
              formatDiametreLabel(diaA),
              formatDiametreLabel(diaB),
            );
            const safeQtyA = diffDualSpacingMetrics.qteA > 0 ? diffDualSpacingMetrics.qteA : 0;
            const safeQtyB = diffDualSpacingMetrics.qteB > 0 ? diffDualSpacingMetrics.qteB : 0;

            linesBarres.push({
              key: `${f.id}:a`,
              label: dualNtLabels.ntLabelA,
              dia: diaA,
              qtyM: safeQtyA,
              nt: diffDualSpacingMetrics.ntA > 0 ? diffDualSpacingMetrics.ntA : 0,
              cutLenM: diffDualSpacingMetrics.cutLenA > 0 ? diffDualSpacingMetrics.cutLenA : 0,
              steelType,
              litLabel: "Surface totale",
            });

            linesBarres.push({
              key: `${f.id}:b`,
              label: dualNtLabels.ntLabelB,
              dia: diaB,
              qtyM: safeQtyB,
              nt: diffDualSpacingMetrics.ntB > 0 ? diffDualSpacingMetrics.ntB : 0,
              cutLenM: diffDualSpacingMetrics.cutLenB > 0 ? diffDualSpacingMetrics.cutLenB : 0,
              steelType,
              litLabel: "Surface totale",
            });

            addQty(diaA, safeQtyA);
            addQty(diaB, safeQtyB);
            continue;
          }

          const diffSharedSpacingMetrics = computeDiffSharedSlabSpacingRecapMetrics({
            nbStr,
            longueurAStr: asString(f.slabLongueurAStr),
            longueurBStr: asString(f.slabLongueurBStr),
            ancrageStr: asString(f.ancrageStr),
            spacingMode,
            spacingRelation: normalizedSpacingRelation,
            calcMethod,
            relation,
            spacingAStr: asString(f.slabEspacementAStr),
            spacingBStr: asString(f.slabEspacementBStr),
          });

          if (diffSharedSpacingMetrics) {
            const safeQtyA = diffSharedSpacingMetrics.qtyA > 0 ? diffSharedSpacingMetrics.qtyA : 0;
            const safeQtyB = diffSharedSpacingMetrics.qtyB > 0 ? diffSharedSpacingMetrics.qtyB : 0;

            linesBarres.push({
              key: `${f.id}:a`,
              label: "N.T.Barre / a",
              dia,
              qtyM: safeQtyA,
              nt: diffSharedSpacingMetrics.ntA > 0 ? diffSharedSpacingMetrics.ntA : 0,
              cutLenM: diffSharedSpacingMetrics.cutLenA > 0 ? diffSharedSpacingMetrics.cutLenA : 0,
              steelType,
              litLabel: "Surface totale",
            });

            linesBarres.push({
              key: `${f.id}:b`,
              label: "N.T.Barre / b",
              dia,
              qtyM: safeQtyB,
              nt: diffSharedSpacingMetrics.ntB > 0 ? diffSharedSpacingMetrics.ntB : 0,
              cutLenM: diffSharedSpacingMetrics.cutLenB > 0 ? diffSharedSpacingMetrics.cutLenB : 0,
              steelType,
              litLabel: "Surface totale",
            });

            addQty(dia, safeQtyA);
            addQty(dia, safeQtyB);
            continue;
          }

          const specialSpacingMetrics = computeSpecialSlabSpacingRecapMetrics({
            nbStr,
            longueurBarreStr: asString(f.slabLongueurAStr),
            ancrageStr: asString(f.ancrageStr),
            spacingMode,
            spacingRelation: normalizedSpacingRelation,
            calcMethod,
            relation,
            spacingAStr: asString(f.slabEspacementAStr),
            spacingBStr: asString(f.slabEspacementBStr),
          });

          if (specialSpacingMetrics) {
            const nt = specialSpacingMetrics.nt;
            const qtyM = specialSpacingMetrics.qtyM;
            const cutLenM = nt > 0 ? qtyM / nt : 0;

            linesBarres.push({
              key: f.id,
              label: "N.T.Barre",
              dia,
              qtyM: qtyM > 0 ? qtyM : 0,
              nt: nt > 0 ? nt : 0,
              cutLenM: cutLenM > 0 ? cutLenM : 0,
              steelType,
              litLabel: "Surface totale",
            });

            addQty(dia, qtyM > 0 ? qtyM : 0);
            continue;
          }

          const qtyM = computeSlabQte(
            calcMethod,
            asString(f.slabSurfaceStr),
            asString(f.slabQtePerM2Str),
          );
          const methodLabel =
            calcMethod === "SURFACE_TOTAL_PER_M2" ? "Surface totale / m²" : "Surface totale";

          linesBarres.push({
            key: f.id,
            label: "Q. Fer",
            dia,
            qtyM: qtyM > 0 ? qtyM : 0,
            nt: 0,
            cutLenM: 0,
            steelType,
            litLabel: methodLabel,
          });

          addQty(dia, qtyM > 0 ? qtyM : 0);
          continue;
        }

        if (isSemellesDesignationInner) {
          const semelleNappe = asTrimmedString(f.barreCategorie, "");
          const isChaise = semelleNappe === "Chaise";
          const relation = asSemelleRelation(f.semelleRelation);
          const semelleAncrage = isChaise ? 0 : parseNonNegativeNumber(asString(f.ancrageStr)) ?? 0;

          const pushSemelleLine = (
            suffix: "a" | "b",
            lineDia: number | null,
            nt: number,
            qtyM: number,
            cutLenM: number,
          ) => {
            const safeNt = nt > 0 ? nt : 0;
            const safeQty = qtyM > 0 ? qtyM : 0;

            linesBarres.push({
              key: `${f.id}:${suffix}`,
              label: suffix === "a" ? "N.T.Barre (a)" : "N.T.Barre (b)",
              dia: lineDia,
              qtyM: safeQty,
              nt: safeNt,
              cutLenM: cutLenM > 0 ? cutLenM : 0,
            });

            addQty(lineDia, safeQty);
          };

          if (isChaise) {
            const n = parseNonNegativeInt(asString(f.nBarreStr)) ?? 0;
            const longueur = parseNonNegativeNumber(asString(f.longueurStr)) ?? 0;
            const nt = nb * n;
            const qtyM = nb * (n * longueur);

            linesBarres.push({
              key: `${f.id}:a`,
              label: "N.T.Barre (a)",
              dia,
              qtyM: qtyM > 0 ? qtyM : 0,
              nt: nt > 0 ? nt : 0,
              cutLenM: longueur > 0 ? longueur : 0,
            });

            addQty(dia, qtyM > 0 ? qtyM : 0);
            continue;
          }

          const isEqualDual = relation === "ab_equal_diff_if";
          const isDiffDual = relation === "ab_diff_diff_if";
          const isDiffShared = relation === "ab_diff_same_if";

          if (isEqualDual || isDiffDual) {
            const diaA =
              typeof f.semelleDiametreAMm === "number" && Number.isFinite(f.semelleDiametreAMm)
                ? f.semelleDiametreAMm
                : dia;

            const diaB =
              typeof f.semelleDiametreBMm === "number" && Number.isFinite(f.semelleDiametreBMm)
                ? f.semelleDiametreBMm
                : dia;

            const nA = parseNonNegativeInt(asString(f.semelleNBarreAStr)) ?? 0;
            const nB = parseNonNegativeInt(asString(f.semelleNBarreBStr)) ?? 0;

            const longueurA = parseNonNegativeNumber(asString(f.semelleLongueurAStr)) ?? 0;
            const longueurB =
              isEqualDual
                ? longueurA
                : parseNonNegativeNumber(asString(f.semelleLongueurBStr)) ?? 0;

            const ntA = nb * nA;
            const ntB = nb * nB;

            const cutLenA = longueurA + semelleAncrage;
            const cutLenB = longueurB + semelleAncrage;

            const qtyA = ntA * cutLenA;
            const qtyB = ntB * cutLenB;

            pushSemelleLine("a", diaA, ntA, qtyA, cutLenA);
            pushSemelleLine("b", diaB, ntB, qtyB, cutLenB);
            continue;
          }

          const totalN = parseNonNegativeInt(asString(f.nBarreStr)) ?? 0;
          const longueurA = parseNonNegativeNumber(asString(f.semelleLongueurAStr)) ?? 0;
          const longueurB = parseNonNegativeNumber(asString(f.semelleLongueurBStr)) ?? 0;

          const effectiveLength = isDiffShared ? (longueurA + longueurB) / 2 : longueurA;
          const nt = nb * totalN;
          const cutLen = effectiveLength + semelleAncrage;
          const qtyM = nt * cutLen;

          linesBarres.push({
            key: `${f.id}:ab`,
            label: "N.T.Barre (a et b)",
            dia,
            qtyM: qtyM > 0 ? qtyM : 0,
            nt: nt > 0 ? nt : 0,
            cutLenM: cutLen > 0 ? cutLen : 0,
          });

          addQty(dia, qtyM > 0 ? qtyM : 0);
          continue;
        }

        const n = parseNonNegativeInt(asString(f.nBarreStr)) ?? 0;
        const anc = parseNonNegativeNumber(asString(f.ancrageStr)) ?? 0;
        const att = parseNonNegativeNumber(asString(f.attenteStr)) ?? 0;
        const barLen = parseNonNegativeNumber(asString(f.longueurStr)) ?? 0;

        const nt = nb * n;
        const qtyM = usesLongueurLabel ? nb * (n * (barLen + anc)) : nb * (n * (h + att + anc));
        const safeNt = nt > 0 ? nt : 0;
        const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

        const steelTypeRaw = asTrimmedString(f.barreCategorie, "");
        const steelType = usesLongueurLabel && steelTypeRaw ? steelTypeRaw : undefined;

        const litIndex = usesLongueurLabel ? barreLitIndexById.get(f.id) : undefined;
        const litLabel = litIndex != null ? `Lit ${litIndex}` : undefined;

        linesBarres.push({
          key: f.id,
          label: "N.T.Barre",
          dia,
          qtyM: qtyM > 0 ? qtyM : 0,
          nt: nt > 0 ? nt : 0,
          cutLenM: cutLenM > 0 ? cutLenM : 0,
          steelType,
          litLabel,
        });

        addQty(dia, qtyM > 0 ? qtyM : 0);
        continue;
      }

      const per =
        computeCadrePerimetre(
          forme,
          asString(f.longueurStr),
          asString(f.largeurStr),
          asString(f.rayonStr),
          asString(f.ancrageStr),
        ) ?? 0;

      const calcMode = f.cadreCalcMode === "NB_CADRE" ? "NB_CADRE" : "ESPACEMENT";
      const nbCadre = parseNonNegativeInt(asString(f.nbCadreStr)) ?? 0;
      const esp = parsePositiveNumber(asString(f.espacementStr)) ?? 0;

      const ratio = calcMode === "NB_CADRE" ? nbCadre : esp > 0 ? h / esp : 0;
      const nt = nb * ratio;
      const qtyM = nb * per * ratio;
      const safeNt = nt > 0 ? nt : 0;
      const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

      const ntLabel =
        forme === "CARRE"
          ? "N.T.C. Carré"
          : forme === "CIRCULAIRE"
            ? "N.T.C. Circulaire"
            : forme === "RECTANGULAIRE"
              ? "N.T.C. Rectangulaire"
              : "N.T.C.";

      linesCadres.push({
        key: f.id,
        label: ntLabel,
        dia,
        qtyM: qtyM > 0 ? qtyM : 0,
        nt: nt > 0 ? nt : 0,
        cutLenM: cutLenM > 0 ? cutLenM : 0,
      });

      addQty(dia, qtyM > 0 ? qtyM : 0);
    }

    for (const b of extraBoxes) {
      const n = parseNonNegativeInt(asString(b.valueStr)) ?? 0;
      const per = computeExtraPerimetre(b.kind, asString(b.longueurStr), asString(b.ancrageStr)) ?? 0;
      const calcMode = b.extraCalcMode === "NB" ? "NB" : "ESPACEMENT";
      const nbExtra = parseNonNegativeInt(asString(b.nbExtraStr)) ?? 0;
      const esp = parsePositiveNumber(asString(b.espacementStr)) ?? 0;

      const ratio = calcMode === "NB" ? nbExtra : esp > 0 ? h / esp : 0;
      const nt = nb * ratio;
      const qtyM = n * per * nt;
      const safeNt = nt > 0 ? nt : 0;
      const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

      const ntLabel = b.kind === "EPINGLE" ? "N.T.Épingle" : "N.T.Étriers";

      linesExtras.push({
        key: b.id,
        label: ntLabel,
        dia: b.diametreMm,
        qtyM: qtyM > 0 ? qtyM : 0,
        nt: nt > 0 ? nt : 0,
        cutLenM: cutLenM > 0 ? cutLenM : 0,
      });

      addQty(b.diametreMm, qtyM > 0 ? qtyM : 0);
    }

    const totals = Array.from(qtyByDia.entries())
      .filter(([, v]) => Number.isFinite(v) && v > 0)
      .sort((a, b) => a[0] - b[0])
      .map(([diaKey, v]) => ({ dia: diaKey, qtyM: v }));

    return { totals, linesCadres, linesBarres, linesExtras };
  }, [extraBoxes, formes, nbStr, hauteurStr, designation, usesLongueurLabel, barreLitIndexById, initDia, showHauteurField]);

  const submit = () => {
    if (!canSubmit) return;

    const payload = buildTotalRowModalPayload({
      designation,
      nomenclature,
      nbStr,
      hauteurStr,
      showHauteurField,
      formes,
      extraBoxes,
      initDia,
    });

    if (payload) void onSubmit(payload);
  };
  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-[95%] h-[90vh] max-h-[90vh] min-h-0 flex gap-4 items-stretch overflow-hidden"
        >
          <RecapPanel
            designation={designation}
            typeName={nomenclature}
            nbStr={nbStr}
            hauteurStr={showHauteurField ? hauteurStr : "0"}
            recap={recap}
          />

          <div className="flex-1 min-h-0 max-h-full rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <ModalHeader title={title} onClose={onClose} disabled={submitting} />

            <div className="p-5 flex flex-1 min-h-0 flex-col overflow-hidden">
              <ModalTopFields
                designation={designation}
                setDesignation={setDesignation}
                nomenclature={nomenclature}
                setNomenclature={setNomenclature}
                nbStr={nbStr}
                setNbStr={setNbStr}
                hauteurStr={hauteurStr}
                setHauteurStr={setHauteurStr}
                showHauteurField={showHauteurField}
                hauteurLabel={hauteurLabel}
                hauteurPlaceholder={hauteurPlaceholder}
                inputClass={inputClass}
                safePage={safePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onAddCadre={addCadre}
                onAddBarre={addBarre}
                onAddEpingle={() => addExtraBox("EPINGLE")}
                onAddEtriers={() => addExtraBox("ETRIERS")}
              />

              <div className="mt-4 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 content-start">
                  {visibleCards.map((c) => {
                    if (c.kind === "EXTRA") {
                      const b = extraMap.get(c.id);
                      if (!b) return null;

                      const idx = extraMeta.indexById.get(b.id) ?? 1;
                      const totalForKind = extraMeta.countByKind[b.kind];
                      const titleLabel =
                        totalForKind > 1
                          ? `${b.kind === "EPINGLE" ? "Épingle" : "Étriers"} ${idx}`
                          : b.kind === "EPINGLE"
                            ? "Épingle"
                            : "Étriers";

                      return (
                        <ExtraBoxCard
                          key={b.id}
                          b={b}
                          titleLabel={titleLabel}
                          designation={designation}
                          safeMms={safeMms}
                          inputClass={inputClass}
                          twoColGrid={twoColGrid}
                          nbStr={nbStr}
                          hauteurStr={showHauteurField ? hauteurStr : "0"}
                          onUpdate={(patch) => updateExtraBox(b.id, patch)}
                          onRemove={() => removeExtraBox(b.id)}
                        />
                      );
                    }

                    const x = formesMap.get(c.id);
                    if (!x) return null;

                    const isBarre = x.forme === "BARRE";
                    const idx = isBarre ? formeMeta.barreIndexById.get(x.id) ?? 1 : formeMeta.cadreIndexById.get(x.id) ?? 1;

                    const label = isBarre
                      ? formeMeta.totalBarres > 1
                        ? `Barre ${idx}`
                        : "Barre"
                      : formeMeta.totalCadres > 1
                        ? `Cadre ${idx}`
                        : "Cadre";

                    if (isBarre) {
                      return (
                        <BarreCard
                          key={x.id}
                          x={x}
                          label={label}
                          designation={designation}
                          safeMms={safeMms}
                          inputClass={inputClass}
                          twoColGrid={twoColGrid}
                          nbStr={nbStr}
                          hauteurStr={showHauteurField ? hauteurStr : "0"}
                          barreLitIndex={barreLitIndexById.get(x.id) ?? null}
                          onPatch={(patch) => updateForme(x.id, patch)}
                          onRemove={() => removeForme(x.id)}
                          onShowAbbreviations={() => setShowAbbreviationHelp(true)}
                        />
                      );
                    }

                    const currentCadreForme: FormeKind = isFormeKind(x.forme) ? x.forme : "CARRE";

                    return (
                      <FormeCard
                        key={x.id}
                        x={x}
                        cadreLabel={label}
                        safeMms={safeMms}
                        inputClass={inputClass}
                        twoColGrid={twoColGrid}
                        nbStr={nbStr}
                        hauteurStr={showHauteurField ? hauteurStr : "0"}
                        onRemove={() => removeForme(x.id)}
                        onSetForme={(v) => setFormeSafe(x.id, isFormeKind(v) ? v : currentCadreForme)}
                        onPatch={(patch) => updateForme(x.id, patch)}
                      />
                    );
                  })}
                </div>
              </div>

              {errorMessage ? <div className="mt-3 text-sm text-red-600">{errorMessage}</div> : null}
            </div>

            <ModalFooter
              submitLabel={submitLabel}
              canSubmit={canSubmit}
              onClose={onClose}
              onSubmit={submit}
              submitting={submitting}
            />
          </div>
        </div>
      </div>

      <FormeBarreAbbreviationsModal
        open={isAbbreviationHelpOpen}
        onClose={() => setShowAbbreviationHelp(false)}
      />
    </div>,
    document.body,
  );
}
