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

function makeForme(seed: Omit<FormeState, "id">): FormeState {
  return { id: makeId(), ...seed };
}

function computeExtraPerimetre(kind: ExtraBoxKind, longueurStr: string, ancrageStr: string) {
  const L = parseNonNegativeNumber(longueurStr);
  const A = parseNonNegativeNumber(ancrageStr);
  if (L == null && A == null) return null;
  const l = L ?? 0;
  const a = A ?? 0;
  if (kind === "EPINGLE") return l + 2 * a;
  return 2 * l + 2 * a;
}

function computeCadrePerimetre(forme: FormeState["forme"], longueurStr: string, largeurStr: string, diamCercleStr: string, ancrageStr: string) {
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

  const [extraBoxes, setExtraBoxes] = useState<ExtraBoxState[]>(() => {
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
  });

  const [formes, setFormes] = useState<FormeState[]>(() => {
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

    const extra = (initial.extraFormes ?? []).map((x) => {
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
      return makeForme({ ...seed, ...cleaned });
    });

    return [makeForme({ ...main, ...mainCleaned }), ...extra];
  });

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

  const [page, setPage] = useState(1);

  const cards: Card[] = useMemo(() => {
    const out: Card[] = [];
    for (const b of extraBoxes) out.push({ kind: "EXTRA", id: b.id });
    for (const f of formes) out.push({ kind: "FORME", id: f.id });
    return out;
  }, [extraBoxes, formes]);

  const totalCount = cards.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / FORMS_PER_PAGE)), [totalCount]);

  const safePage = useMemo(() => clamp(page, 1, totalPages), [page, totalPages]);
  const handlePageChange = (p: number) => setPage(clamp(p, 1, totalPages));

  const pageStart = (safePage - 1) * FORMS_PER_PAGE;
  const visibleCards = cards.slice(pageStart, pageStart + FORMS_PER_PAGE);

  const addExtraBox = (kind: ExtraBoxKind) => {
    setExtraBoxes((prev) => {
      const next = [
        ...prev,
        {
          id: makeId(),
          kind,
          diametreMm: initDia,
          valueStr: "0",
          longueurStr: "0",
          ancrageStr: "0",
          perimetreStr: "0",
          espacementStr: "0",
        },
      ];
      const nextTotalPages = Math.max(1, Math.ceil((formes.length + next.length) / FORMS_PER_PAGE));
      setPage(nextTotalPages);
      return next;
    });
  };

  const updateExtraBox = (id: string, patch: Partial<ExtraBoxState>) => {
    setExtraBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeExtraBox = (id: string) => {
    setExtraBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  const updateForme = (id: string, patch: Partial<FormeState>) => {
    setFormes((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const setFormeSafe = (id: string, next: FormeState["forme"]) => {
    setFormes((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        const reset = resetFieldsForForme(next, x);
        return { ...x, ...reset, forme: next };
      }),
    );
  };

  const removeForme = (id: string) => {
    setFormes((prev) => prev.filter((x) => x.id !== id));
  };

  const addCadre = () => {
    setFormes((prev) => {
      const last = prev[prev.length - 1];
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
      const next = [...prev, makeForme({ ...seed, ...cleaned })];

      const nextTotalPages = Math.max(1, Math.ceil((extraBoxes.length + next.length) / FORMS_PER_PAGE));
      setPage(nextTotalPages);

      return next;
    });
  };

  const addBarre = () => {
    setFormes((prev) => {
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
      const next = [...prev, makeForme({ ...seed, ...cleaned })];

      const nextTotalPages = Math.max(1, Math.ceil((extraBoxes.length + next.length) / FORMS_PER_PAGE));
      setPage(nextTotalPages);

      return next;
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
        <div ref={panelRef} className="w-full max-w-6xl min-h-[70%] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col overflow-hidden">
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
    </div>,
    document.body,
  );
}
