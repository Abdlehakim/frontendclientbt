import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import TablePagination from "@/components/tablePagination";

import type { Card, ExtraBoxKind, ExtraBoxPayload, ExtraBoxState, ExtraFormePayload, FormeState, TotalRowModalPayload } from "./types";
import {
  clamp,
  formeNeedsParams,
  formeValid,
  makeId,
  parseNonNegativeInt,
  parseNonNegativeNumber,
  parsePositiveInt,
  parsePositiveNumber,
  resetFieldsForForme,
} from "./utils";
import { AddPlusDropdown, DesignationDropdown, ExtraBoxCard, FormeCard } from "./components";
import RecapPanel, { type RecapData } from "./components/RecapPanel";

function computeExtraPerimetre(kind: ExtraBoxKind, longueurStr: string, ancrageStr: string) {
  const L = parseNonNegativeNumber(longueurStr);
  const A = parseNonNegativeNumber(ancrageStr);
  if (L == null && A == null) return null;
  const l = L ?? 0;
  const a = A ?? 0;
  if (kind === "EPINGLE") return l + 2 * a;
  return 2 * l + 2 * a;
}

function computeCadrePerimetre(
  forme: FormeState["forme"],
  longueurStr: string,
  largeurStr: string,
  diamCercleStr: string,
  ancrageStr: string,
) {
  const L = parseNonNegativeNumber(longueurStr);
  const W = parseNonNegativeNumber(largeurStr);
  const D = parseNonNegativeNumber(diamCercleStr);
  const A = parseNonNegativeNumber(ancrageStr);

  const hasAny = L != null || W != null || D != null || A != null;
  if (!hasAny) return null;

  const l = L ?? 0;
  const w = W ?? 0;
  const d = D ?? 0;
  const a = A ?? 0;

  if (forme === "CARRE") return 4 * l + 2 * a;
  if (forme === "CIRCULAIRE") return d * Math.PI + 2 * a;
  if (forme === "RECTANGULAIRE") return 2 * (l + w) + 2 * a;

  return null;
}

function buildInitialExtraBoxes(shouldHydrate: boolean, initial: Partial<TotalRowModalPayload> | undefined, initDia: number): ExtraBoxState[] {
  if (!shouldHydrate) return [];
  const out: ExtraBoxState[] = [];

  if (Array.isArray(initial?.extraBoxes) && initial!.extraBoxes!.length) {
    for (const b of initial!.extraBoxes!) {
      out.push({
        id: makeId(),
        kind: b.kind,
        diametreMm: typeof b.diametreMm === "number" ? b.diametreMm : initDia,
        valueStr: b.n == null ? "0" : String(b.n),
        longueurStr: b.longueur == null ? "0" : String(b.longueur),
        ancrageStr: b.ancrage == null ? "0" : String(b.ancrage),
        perimetreStr: b.perimetre == null ? "0" : String(b.perimetre),
        espacementStr: b.espacement == null ? "0" : String(b.espacement),
      });
    }
    return out;
  }

  if (initial?.epingle != null) {
    out.push({
      id: makeId(),
      kind: "EPINGLE",
      diametreMm: initDia,
      valueStr: String(initial.epingle ?? 0),
      longueurStr: "0",
      ancrageStr: "0",
      perimetreStr: "0",
      espacementStr: "0",
    });
  }

  if (initial?.etriers != null) {
    out.push({
      id: makeId(),
      kind: "ETRIERS",
      diametreMm: initDia,
      valueStr: String(initial.etriers ?? 0),
      longueurStr: "0",
      ancrageStr: "0",
      perimetreStr: "0",
      espacementStr: "0",
    });
  }

  return out;
}

function buildInitialFormes(shouldHydrate: boolean, initial: Partial<TotalRowModalPayload> | undefined, initDia: number): FormeState[] {
  if (!shouldHydrate) return [];
  if (!initial?.forme) return [];

  const main: Omit<FormeState, "id"> = {
    forme: initial.forme ?? "BARRE",
    diametreMm: typeof initial.diametreMm === "number" ? initial.diametreMm : initDia,
    nBarreStr: initial.nBarre == null ? "0" : String(initial.nBarre),
    longueurStr: initial.longueur == null ? "0" : String(initial.longueur),
    largeurStr: initial.largeur == null ? "0" : String(initial.largeur),
    rayonStr: initial.rayon == null ? "0" : String(initial.rayon),
    ancrageStr: initial.ancrage == null ? "0" : String(initial.ancrage),
    attenteStr: initial.attenteBarre == null ? "0" : String(initial.attenteBarre),
    perimetreStr: initial.perimetre == null ? "0" : String(initial.perimetre),
    espacementStr: initial.espacement == null ? "0" : String(initial.espacement),
  };

  const mainCleaned = resetFieldsForForme(main.forme, main);
  const mainState: FormeState = { id: makeId(), ...main, ...mainCleaned };

  const extras = (initial.extraFormes ?? []).map((x) => {
    const seed: Omit<FormeState, "id"> = {
      forme: x.forme ?? "CARRE",
      diametreMm: typeof x.diametreMm === "number" ? x.diametreMm : initDia,
      nBarreStr: x.nBarre == null ? "0" : String(x.nBarre),
      longueurStr: x.longueur == null ? "0" : String(x.longueur),
      largeurStr: x.largeur == null ? "0" : String(x.largeur),
      rayonStr: x.rayon == null ? "0" : String(x.rayon),
      ancrageStr: x.ancrage == null ? "0" : String(x.ancrage),
      attenteStr: x.attenteBarre == null ? "0" : String(x.attenteBarre),
      perimetreStr: x.perimetre == null ? "0" : String(x.perimetre),
      espacementStr: x.espacement == null ? "0" : String(x.espacement),
    };
    const cleaned = resetFieldsForForme(seed.forme, seed);
    return { id: makeId(), ...seed, ...cleaned };
  });

  return [mainState, ...extras];
}

function buildInitialOrder(extraBoxesInit: ExtraBoxState[], formesInit: FormeState[]): Card[] {
  const out: Card[] = [];
  for (const b of extraBoxesInit) out.push({ kind: "EXTRA", id: b.id });
  for (const f of formesInit) out.push({ kind: "FORME", id: f.id });
  return out;
}

function insertCardAtEndOfCurrentPage(order: Card[], page: number, perPage: number, card: Card) {
  const prevTotalPages = Math.max(1, Math.ceil(order.length / perPage));
  const currentPage = clamp(page, 1, prevTotalPages);

  const currentStart = (currentPage - 1) * perPage;
  const currentCount = order.slice(currentStart, currentStart + perPage).length;

  const insertIndex = currentStart + currentCount;
  const nextOrder = [...order.slice(0, insertIndex), card, ...order.slice(insertIndex)];

  const nextTotalPages = Math.max(1, Math.ceil(nextOrder.length / perPage));
  const nextPage = clamp(Math.floor(insertIndex / perPage) + 1, 1, nextTotalPages);

  return { nextOrder, nextPage };
}

export default function TotalRowModalWindowInner({
  open,
  title,
  submitLabel,
  inputClass,
  mms,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  inputClass: string;
  mms: number[];
  initial?: Partial<TotalRowModalPayload>;
  onClose: () => void;
  onSubmit: (payload: TotalRowModalPayload) => void;
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
    const anyNumbers =
      initial?.nb != null ||
      initial?.hauteur != null ||
      initial?.enrobage != null ||
      initial?.epingle != null ||
      initial?.etriers != null ||
      initial?.ancrage != null ||
      initial?.attenteBarre != null ||
      initial?.nBarre != null ||
      initial?.longueur != null ||
      initial?.largeur != null ||
      initial?.rayon != null ||
      initial?.perimetre != null ||
      initial?.espacement != null;
    const anyExtra = Array.isArray(initial?.extraFormes) && initial!.extraFormes!.length > 0;
    const anyExtraBoxes = Array.isArray(initial?.extraBoxes) && initial!.extraBoxes!.length > 0;
    return !!(d || t || anyNumbers || anyExtra || anyExtraBoxes);
  }, [initial]);

  const [designation, setDesignation] = useState(() => initial?.designation ?? "");
  const [typeName, setTypeName] = useState(() => initial?.typeName ?? "");
  const [nbStr, setNbStr] = useState(() => (initial?.nb == null ? "0" : String(initial?.nb)));
  const [hauteurStr, setHauteurStr] = useState(() => (initial?.hauteur == null ? "0" : String(initial?.hauteur)));
  const [enrobageStr, setEnrobageStr] = useState(() => (initial?.enrobage == null ? "0" : String(initial?.enrobage)));

  const [st, setSt] = useState<{
    extraBoxes: ExtraBoxState[];
    formes: FormeState[];
    cardOrder: Card[];
    page: number;
  }>(() => {
    const extraBoxesInit = buildInitialExtraBoxes(shouldHydrate, initial, initDia);
    const formesInit = buildInitialFormes(shouldHydrate, initial, initDia);
    const orderInit = buildInitialOrder(extraBoxesInit, formesInit);
    return { extraBoxes: extraBoxesInit, formes: formesInit, cardOrder: orderInit, page: 1 };
  });

  const extraBoxes = st.extraBoxes;
  const formes = st.formes;
  const cards = st.cardOrder;

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
    const id = makeId();
    setSt((prev) => {
      const nextBoxes = [
        ...prev.extraBoxes,
        {
          id,
          kind,
          diametreMm: initDia,
          valueStr: "0",
          longueurStr: "0",
          ancrageStr: "0",
          perimetreStr: "0",
          espacementStr: "0",
        },
      ];

      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, { kind: "EXTRA", id });
      return { ...prev, extraBoxes: nextBoxes, cardOrder: nextOrder, page: nextPage };
    });
  };

  const updateExtraBox = (id: string, patch: Partial<ExtraBoxState>) => {
    setSt((prev) => ({
      ...prev,
      extraBoxes: prev.extraBoxes.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const removeExtraBox = (id: string) => {
    setSt((prev) => {
      const nextBoxes = prev.extraBoxes.filter((b) => b.id !== id);
      const nextOrder = prev.cardOrder.filter((c) => !(c.kind === "EXTRA" && c.id === id));
      const tp = Math.max(1, Math.ceil(nextOrder.length / FORMS_PER_PAGE));
      return { ...prev, extraBoxes: nextBoxes, cardOrder: nextOrder, page: clamp(prev.page, 1, tp) };
    });
  };

  const updateForme = (id: string, patch: Partial<FormeState>) => {
    setSt((prev) => ({
      ...prev,
      formes: prev.formes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  };

  const setFormeSafe = (id: string, next: FormeState["forme"]) => {
    setSt((prev) => ({
      ...prev,
      formes: prev.formes.map((x) => {
        if (x.id !== id) return x;
        const reset = resetFieldsForForme(next, x);
        return { ...x, ...reset, forme: next };
      }),
    }));
  };

  const removeForme = (id: string) => {
    setSt((prev) => {
      const nextFormes = prev.formes.filter((x) => x.id !== id);
      const nextOrder = prev.cardOrder.filter((c) => !(c.kind === "FORME" && c.id === id));
      const tp = Math.max(1, Math.ceil(nextOrder.length / FORMS_PER_PAGE));
      return { ...prev, formes: nextFormes, cardOrder: nextOrder, page: clamp(prev.page, 1, tp) };
    });
  };

  const addCadre = () => {
    const id = makeId();
    setSt((prev) => {
      const last = prev.formes[prev.formes.length - 1];
      const nextForme: FormeState["forme"] = last && last.forme !== "BARRE" ? last.forme : "CARRE";

      const seed: Omit<FormeState, "id"> = {
        forme: nextForme,
        diametreMm: last?.diametreMm ?? initDia,
        nBarreStr: "0",
        longueurStr: "0",
        largeurStr: "0",
        rayonStr: "0",
        ancrageStr: "0",
        attenteStr: "0",
        perimetreStr: "0",
        espacementStr: "0",
      };

      const cleaned = resetFieldsForForme(seed.forme, seed);
      const nextFormes = [...prev.formes, { id, ...seed, ...cleaned }];

      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, { kind: "FORME", id });
      return { ...prev, formes: nextFormes, cardOrder: nextOrder, page: nextPage };
    });
  };

  const addBarre = () => {
    const id = makeId();
    setSt((prev) => {
      const seed: Omit<FormeState, "id"> = {
        forme: "BARRE",
        diametreMm: initDia,
        nBarreStr: "0",
        longueurStr: "0",
        largeurStr: "0",
        rayonStr: "0",
        ancrageStr: "0",
        attenteStr: "0",
        perimetreStr: "0",
        espacementStr: "0",
      };

      const cleaned = resetFieldsForForme(seed.forme, seed);
      const nextFormes = [...prev.formes, { id, ...seed, ...cleaned }];

      const { nextOrder, nextPage } = insertCardAtEndOfCurrentPage(prev.cardOrder, prev.page, FORMS_PER_PAGE, { kind: "FORME", id });
      return { ...prev, formes: nextFormes, cardOrder: nextOrder, page: nextPage };
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const closeOnBackdrop = (ev: ReactMouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  const designationOk = (designation ?? "").trim().length > 0;
  const formesOk = formes.length > 0 && formes.every((x) => formeValid(x.forme, x.nBarreStr, x.longueurStr, x.largeurStr, x.rayonStr));
  const canSubmit = designationOk && formesOk;

  const recap: RecapData = useMemo(() => {
    const nb = parsePositiveInt(nbStr) ?? 0;
    const h = parsePositiveNumber(hauteurStr) ?? 0;

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
      if (f.forme === "BARRE") {
        const n = parseNonNegativeInt(f.nBarreStr) ?? 0;
        const anc = parseNonNegativeNumber(f.ancrageStr) ?? 0;
        const att = parseNonNegativeNumber(f.attenteStr) ?? 0;

        const nt = nb * n;
        const qtyM = nb * (n * (h + att + anc));
        const safeNt = nt > 0 ? nt : 0;
        const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

        linesBarres.push({
          key: f.id,
          label: "N.T.Barre",
          dia: f.diametreMm,
          qtyM: qtyM > 0 ? qtyM : 0,
          nt: nt > 0 ? nt : 0,
          cutLenM: cutLenM > 0 ? cutLenM : 0,
        });

        addQty(f.diametreMm, qtyM > 0 ? qtyM : 0);
        continue;
      }

      const per = computeCadrePerimetre(f.forme, f.longueurStr, f.largeurStr, f.rayonStr, f.ancrageStr) ?? 0;
      const esp = parsePositiveNumber(f.espacementStr) ?? 0;

      const ratio = esp > 0 ? h / esp : 0;
      const nt = nb * ratio;
      const qtyM = nb * per * ratio;
      const safeNt = nt > 0 ? nt : 0;
      const cutLenM = safeNt > 0 ? qtyM / safeNt : 0;

      const ntLabel =
        f.forme === "CARRE"
          ? "N.T.C. Carré"
          : f.forme === "CIRCULAIRE"
            ? "N.T.C. Circulaire"
            : f.forme === "RECTANGULAIRE"
              ? "N.T.C. Rectangulaire"
              : "N.T.C.";

      linesCadres.push({
        key: f.id,
        label: ntLabel,
        dia: f.diametreMm,
        qtyM: qtyM > 0 ? qtyM : 0,
        nt: nt > 0 ? nt : 0,
        cutLenM: cutLenM > 0 ? cutLenM : 0,
      });

      addQty(f.diametreMm, qtyM > 0 ? qtyM : 0);
    }

    for (const b of extraBoxes) {
      const n = parseNonNegativeInt(b.valueStr) ?? 0;
      const per = computeExtraPerimetre(b.kind, b.longueurStr, b.ancrageStr) ?? 0;
      const esp = parsePositiveNumber(b.espacementStr) ?? 0;

      const ratio = esp > 0 ? h / esp : 0;
      const nt = nb * ratio;
      const qtyM = nb * (n * per) * ratio;
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
      .map(([dia, v]) => ({ dia, qtyM: v }));

    return { totals, linesCadres, linesBarres, linesExtras };
  }, [extraBoxes, formes, nbStr, hauteurStr]);

  const submit = () => {
    if (!canSubmit) return;

    const nb = parsePositiveInt(nbStr) ?? null;
    const hauteur = parsePositiveNumber(hauteurStr) ?? null;
    const enrobage = parsePositiveNumber(enrobageStr) ?? null;

    const extraBoxesPayload: ExtraBoxPayload[] = extraBoxes.map((b) => ({
      kind: b.kind,
      diametreMm: b.diametreMm,
      n: parseNonNegativeInt(b.valueStr) ?? null,
      longueur: parseNonNegativeNumber(b.longueurStr) ?? null,
      ancrage: parseNonNegativeNumber(b.ancrageStr) ?? null,
      perimetre: computeExtraPerimetre(b.kind, b.longueurStr, b.ancrageStr),
      espacement: parseNonNegativeNumber(b.espacementStr) ?? null,
    }));

    const epingleVals = extraBoxesPayload
      .filter((b) => b.kind === "EPINGLE")
      .map((b) => b.n)
      .filter((v): v is number => v != null);

    const etriersVals = extraBoxesPayload
      .filter((b) => b.kind === "ETRIERS")
      .map((b) => b.n)
      .filter((v): v is number => v != null);

    const epingle = epingleVals.length ? epingleVals.reduce((a, b) => a + b, 0) : null;
    const etriers = etriersVals.length ? etriersVals.reduce((a, b) => a + b, 0) : null;

    const main = formes[0];
    if (!main) return;

    const mainShow = formeNeedsParams(main.forme);

    const mainNBarre = main.forme === "BARRE" ? parsePositiveInt(main.nBarreStr) : null;
    const mainLongueur = main.forme === "CARRE" || main.forme === "RECTANGULAIRE" ? parsePositiveNumber(main.longueurStr) : null;
    const mainLargeur = main.forme === "RECTANGULAIRE" ? parsePositiveNumber(main.largeurStr) : null;
    const mainRayon = main.forme === "CIRCULAIRE" ? parsePositiveNumber(main.rayonStr) : null;

    const mainAncrage = parseNonNegativeNumber(main.ancrageStr) ?? null;
    const mainAttenteBarre = main.forme === "BARRE" ? (parseNonNegativeNumber(main.attenteStr) ?? null) : null;

    const mainPerCalc = computeCadrePerimetre(main.forme, main.longueurStr, main.largeurStr, main.rayonStr, main.ancrageStr);
    const mainPerimetre = mainShow ? (mainPerCalc != null && mainPerCalc > 0 ? mainPerCalc : null) : null;

    const mainEspacement = mainShow ? (parsePositiveNumber(main.espacementStr) ?? null) : null;

    const extras: ExtraFormePayload[] = formes.slice(1).map((x) => {
      const xShow = formeNeedsParams(x.forme);
      const per = computeCadrePerimetre(x.forme, x.longueurStr, x.largeurStr, x.rayonStr, x.ancrageStr);
      return {
        forme: x.forme,
        diametreMm: x.diametreMm,
        nBarre: x.forme === "BARRE" ? parsePositiveInt(x.nBarreStr) : null,
        longueur: x.forme === "CARRE" || x.forme === "RECTANGULAIRE" ? parsePositiveNumber(x.longueurStr) : null,
        largeur: x.forme === "RECTANGULAIRE" ? parsePositiveNumber(x.largeurStr) : null,
        rayon: x.forme === "CIRCULAIRE" ? parsePositiveNumber(x.rayonStr) : null,
        ancrage: parseNonNegativeNumber(x.ancrageStr) ?? null,
        attenteBarre: x.forme === "BARRE" ? (parseNonNegativeNumber(x.attenteStr) ?? null) : null,
        perimetre: xShow ? (per != null && per > 0 ? per : null) : null,
        espacement: xShow ? (parsePositiveNumber(x.espacementStr) ?? null) : null,
      };
    });

    onSubmit({
      designation: (designation ?? "").trim(),
      typeName: (typeName ?? "").trim(),
      nb,
      hauteur,
      enrobage,
      forme: main.forme,
      diametreMm: main.diametreMm,
      nBarre: mainNBarre,
      longueur: mainLongueur,
      largeur: mainLargeur,
      rayon: mainRayon,
      ancrage: mainAncrage,
      attenteBarre: mainAttenteBarre,
      perimetre: mainPerimetre,
      espacement: mainEspacement,
      epingle,
      etriers,
      extraFormes: extras.length ? extras : undefined,
      extraBoxes: extraBoxesPayload.length ? extraBoxesPayload : undefined,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-220">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-[85%] min-h-[75%] flex gap-4 items-stretch">
          <RecapPanel designation={designation} typeName={typeName} nbStr={nbStr} hauteurStr={hauteurStr} enrobageStr={enrobageStr} recap={recap} />

          <div className="flex-1 rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                title="Fermer"
                className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform"
              >
                <CiCircleRemove size={26} />
              </button>
            </div>

            <div className="p-5 flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="flex flex-col md:col-span-4">
                  <DesignationDropdown label="Designations" value={designation} onChange={setDesignation} />
                </div>

                <div className="flex flex-col md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Type</label>
                  <input className={inputClass} value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="Ex: T1 / T10 /P1 ..." />
                </div>

                <div className="flex flex-col md:col-span-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1">NB</label>
                  <input className={inputClass} value={nbStr} onChange={(e) => setNbStr(e.target.value)} placeholder="Ex: 1" inputMode="numeric" />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Hauteur</label>
                  <input className={inputClass} value={hauteurStr} onChange={(e) => setHauteurStr(e.target.value)} placeholder="Ex: 2.8" inputMode="decimal" />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-1">Enrobage</label>
                  <input className={inputClass} value={enrobageStr} onChange={(e) => setEnrobageStr(e.target.value)} placeholder="Ex: 3" inputMode="decimal" />
                </div>

                <div className="md:col-span-12 flex items-center justify-end border-t border-gray-200 pt-3">
                  <AddPlusDropdown onAddCadre={addCadre} onAddBarre={addBarre} onAddEpingle={() => addExtraBox("EPINGLE")} onAddEtriers={() => addExtraBox("ETRIERS")} />
                </div>

                {visibleCards.map((c) => {
                  if (c.kind === "EXTRA") {
                    const b = extraMap.get(c.id);
                    if (!b) return null;

                    const idx = extraMeta.indexById.get(b.id) ?? 1;
                    const totalForKind = extraMeta.countByKind[b.kind];
                    const titleLabel =
                      totalForKind > 1 ? `${b.kind === "EPINGLE" ? "Épingle" : "Étriers"} ${idx}` : b.kind === "EPINGLE" ? "Épingle" : "Étriers";

                    return (
                      <ExtraBoxCard
                        key={b.id}
                        b={b}
                        titleLabel={titleLabel}
                        safeMms={safeMms}
                        inputClass={inputClass}
                        twoColGrid={twoColGrid}
                        nbStr={nbStr}
                        hauteurStr={hauteurStr}
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

                  return (
                    <FormeCard
                      key={x.id}
                      x={x}
                      cadreLabel={label}
                      safeMms={safeMms}
                      inputClass={inputClass}
                      twoColGrid={twoColGrid}
                      nbStr={nbStr}
                      hauteurStr={hauteurStr}
                      onRemove={() => removeForme(x.id)}
                      onSetForme={(v) => setFormeSafe(x.id, v)}
                      onPatch={(patch) => updateForme(x.id, patch)}
                    />
                  );
                })}

                <div className="md:col-span-12 pt-2">
                  <TablePagination currentPage={safePage} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              </div>
            </div>

            <div
              className="
                rounded-b-xl bg-gray-50
                border-t border-slate-900/10
                px-3.5 pt-2.5 pb-3.5
                flex items-center justify-between gap-3
              "
              aria-label="Actions du formulaire"
            >
              <div className="flex items-center justify-start gap-2 flex-1">
                <button type="button" className="stepper__nav" onClick={onClose}>
                  Annuler
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
                <button type="button" className="stepper__nav" onClick={submit} disabled={!canSubmit} aria-disabled={!canSubmit}>
                  {submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
