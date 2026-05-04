// src/components/ferraillage/Edit/EditCalculeTotalFerraillage.tsx
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { FaRegEdit, FaTrashAlt } from "react-icons/fa";
import { LuPlus } from "react-icons/lu";
import { IoIosArrowDropdown, IoIosArrowDropup } from "react-icons/io";
import DeleteConfirmModal from "@/components/common/DeleteConfirmModal";
import {
  ferraillageApi,
  isApiError as isFerApiError,
  type FerProjectLineDTO,
  type FerProjectNiveauDTO,
} from "@/lib/ferraillageApi";
import NiveauModalWindow from "./windows/NiveauModalWindow";
import TotalRowModalWindow, {
  type TotalRowModalPayload,
  type RowForme,
  type ExtraBoxKind,
  type ExtraFormePayload,
} from "./windows/TotalRowModalWindow";
import {
  computeSlabSurfacePerM2SpacingMetrics,
  computeSlabSurfacePerM2SplitMetrics,
} from "./windows/totalRowModal/calculations/slabCalculations";
import { normalizeSlabSurfacePerM2Relation } from "./windows/totalRowModal/state/guards";
import { safeDivide, safeNumber } from "./windows/totalRowModal/utils";

type TotalRow = {
  id: string;
  designation: string;
  typeName: string;
  forme: RowForme;
  nb: number | null;
  diametre: number;
  qtyByMm: Record<number, number>;
  poidsByMm: Record<number, number>;
  payload?: TotalRowModalPayload;
};

type NiveauTotal = {
  id: string;
  niveauName: string;
  note: string;
  diametres: number[];
  sousTraitants: string[];
  rows: TotalRow[];
};

type TotalFerraillageData = {
  rapportId: string;
  chantierName: string;
  niveaux: NiveauTotal[];
};

type EditCalculeTotalFerraillageProps = {
  initialData?: TotalFerraillageData | null;
  onNiveauCreated?: (niveau: FerProjectNiveauDTO) => void;
  onLineCreated?: (niveauId: string, ligne: FerProjectLineDTO) => void;
  onLineUpdated?: (niveauId: string, ligne: FerProjectLineDTO) => void;
  onLineDeleted?: (niveauId: string, ligneId: string) => void;
};

type Totals = {
  qty: Record<number, number>;
  poids: Record<number, number>;
};

const STANDARD_MMS = [6, 8, 10, 12, 14, 16, 20, 25, 32, 40, 50] as const;
const DEFAULT_MMS = [6, 8, 10, 12, 14, 16];

const EMPTY_TOTAL_FERRAILLAGE: TotalFerraillageData = {
  rapportId: "",
  chantierName: "",
  niveaux: [],
};

function mapProjectNiveauToLocal(niveau: FerProjectNiveauDTO): NiveauTotal {
  return {
    id: niveau.id,
    niveauName: niveau.name,
    note: niveau.note ?? "",
    diametres: [...(niveau.selectedMms ?? [])].sort((a, b) => a - b),
    sousTraitants: [...(niveau.sousTraitants ?? [])],
    rows: [],
  };
}

function mapProjectLineToLocal(line: FerProjectLineDTO): TotalRow {
  return {
    id: line.id,
    designation: line.designation,
    typeName: line.nomenclature ?? "",
    forme: (typeof line.forme === "string" && line.forme ? line.forme : "BARRE") as RowForme,
    nb: line.nb ?? null,
    diametre: line.diametreMm ?? 0,
    qtyByMm: Object.fromEntries(Object.entries(line.qtyByMm ?? {}).map(([key, value]) => [Number(key), value])),
    poidsByMm: Object.fromEntries(Object.entries(line.poidsByMm ?? {}).map(([key, value]) => [Number(key), value])),
    payload: line.payload as TotalRowModalPayload,
  };
}

function fmtNumTrim3(n: number) {
  const v = safeNumber(n);
  const fixed = v.toFixed(3).replace(".", ",");
  const [rawInt, rawDec = ""] = fixed.split(",");
  const intPart = rawInt === "-0" ? "0" : rawInt;
  const decPart = rawDec.replace(/0+$/g, "");
  if (!decPart) return intPart;
  return `${intPart},${decPart}`;
}

function cellVal(map: Record<number, number>, mm: number) {
  return fmtNumTrim3(map[mm] ?? 0);
}

function computeTotals(rows: TotalRow[], mms: number[]): Totals {
  const qty: Record<number, number> = {};
  const poids: Record<number, number> = {};
  for (const mm of mms) {
    qty[mm] = 0;
    poids[mm] = 0;
  }
  for (const r of rows) {
    for (const mm of mms) {
      qty[mm] = safeNumber(qty[mm] + safeNumber(r.qtyByMm[mm]));
      poids[mm] = safeNumber(poids[mm] + safeNumber(r.poidsByMm[mm]));
    }
  }
  return { qty, poids };
}

function AddRowInsideTable({
  colSpan,
  bottomOffsetPx,
  onClick,
  text,
}: {
  colSpan: number;
  bottomOffsetPx: number;
  onClick: () => void;
  text: string;
}) {
  return (
    <tr className="bg-white">
      <td colSpan={colSpan} className="sticky h-22 z-20" style={{ bottom: `${bottomOffsetPx}px` }}>
        <div className="w-full flex justify-center">
          <button type="button" className="ButtonSquare ButtonSquare--expandText" title={text} aria-label={text} onClick={onClick}>
            <LuPlus size={16} />
            <span className="ButtonSquare__text">{text}</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

function buildZerosByMm(mms: number[]) {
  const out: Record<number, number> = {};
  for (const mm of mms) out[mm] = 0;
  return out;
}

function kgPerMeter(mm: number) {
  return safeDivide(safeNumber(mm) * safeNumber(mm), 162);
}

function computeExtraPerimetreNum(kind: ExtraBoxKind, longueur: number, ancrage: number) {
  if (kind === "EPINGLE") return longueur + 2 * ancrage;
  return 2 * longueur + 2 * ancrage;
}

function computeCadrePerimetreNum(forme: Exclude<RowForme, "BARRE">, longueur: number, largeur: number, diamCercle: number, ancrage: number) {
  if (forme === "CARRE") return 4 * longueur + 2 * ancrage;
  if (forme === "CIRCULAIRE") return diamCercle * Math.PI + 2 * ancrage;
  if (forme === "RECTANGULAIRE") return 2 * (longueur + largeur) + 2 * ancrage;
  return 0;
}

function isSlabDesignationName(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "dalle pleine" ||
    normalized === "chape" ||
    normalized === "radier" ||
    normalized === "voile"
  );
}

function isSlabSurfacePerM2SpacingDesignationName(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "dalle pleine" ||
    normalized === "chape" ||
    normalized === "radier" ||
    normalized === "voile"
  );
}

function computeSlabSpacingQtyEntriesFromPayload(
  payload: TotalRowModalPayload | ExtraFormePayload,
  parentNb: number,
  fallbackDia: number,
  isSlabSurfacePerM2SpacingDesignation: boolean,
) {
  if (
    isSlabSurfacePerM2SpacingDesignation &&
    payload.slabCalcMethod === "SURFACE_TOTAL_PER_M2" &&
    payload.slabSpacingMode === "ESPACEMENT" &&
    (payload.slabSpacingRelation === "EA_EQ_EB" || payload.slabSpacingRelation === "EA_NE_EB")
  ) {
    const dallePleinePerM2Metrics = computeSlabSurfacePerM2SpacingMetrics({
      surfaceStr: String(payload.slabSurface ?? 0),
      perimetreStr: String(payload.slabPerimetre ?? 0),
      ancrageLineaireStr: String(payload.slabAncrageLineaire ?? 0),
      spacingRelation: payload.slabSpacingRelation,
      spacingAStr: String(payload.slabEspacementA ?? 0),
      spacingBStr: String(payload.slabEspacementB ?? 0),
    });
    const dallePleineRelation = normalizeSlabSurfacePerM2Relation(payload.slabRelation);

    if (dallePleineRelation === "ab_equal_diff_if") {
      const diaA =
        typeof payload.slabDiametreAMm === "number" && Number.isFinite(payload.slabDiametreAMm)
          ? payload.slabDiametreAMm
          : fallbackDia;
      const diaB =
        typeof payload.slabDiametreBMm === "number" && Number.isFinite(payload.slabDiametreBMm)
          ? payload.slabDiametreBMm
          : fallbackDia;
      const splitMetrics = computeSlabSurfacePerM2SplitMetrics({
        qA: dallePleinePerM2Metrics.qA,
        qB: dallePleinePerM2Metrics.qB,
        ancrageM: dallePleinePerM2Metrics.ancrageM,
        multiplier: parentNb,
        commercialBarLengthM: dallePleinePerM2Metrics.cutLenM,
      });

      return [
        {
          dia: diaA,
          qtyM: splitMetrics.qtyA,
        },
        {
          dia: diaB,
          qtyM: splitMetrics.qtyB,
        },
      ];
    }

    return [{ dia: fallbackDia, qtyM: parentNb > 0 ? parentNb * dallePleinePerM2Metrics.qtyM : 0 }];
  }

  if (
    payload.slabCalcMethod !== "SURFACE_TOTAL" ||
    payload.slabSpacingMode !== "ESPACEMENT" ||
    (payload.slabSpacingRelation !== "EA_EQ_EB" && payload.slabSpacingRelation !== "EA_NE_EB")
  ) {
    return null;
  }

  const longueurA = payload.slabLongueurA ?? 0;
  const longueurB = payload.slabLongueurB ?? 0;
  const espacementA = payload.slabEspacementA ?? 0;
  const espacementB =
    payload.slabSpacingRelation === "EA_NE_EB" ? payload.slabEspacementB ?? 0 : espacementA;
  const ancrage = payload.ancrage ?? 0;

  const ntA = espacementA > 0 ? safeDivide(longueurA, espacementA) : 0;
  const ntB = espacementB > 0 ? safeDivide(longueurB, espacementB) : 0;
  const qtyA = safeNumber(parentNb * ntA * (longueurB + ancrage));
  const qtyB = safeNumber(parentNb * ntB * (longueurA + ancrage));

  if (payload.slabRelation === "ab_diff_same_if") {
    return [{ dia: fallbackDia, qtyM: safeNumber(qtyA + qtyB) }];
  }

  if (payload.slabRelation === "ab_diff_diff_if") {
    const diaA =
      typeof payload.slabDiametreAMm === "number" && Number.isFinite(payload.slabDiametreAMm)
        ? payload.slabDiametreAMm
        : fallbackDia;
    const diaB =
      typeof payload.slabDiametreBMm === "number" && Number.isFinite(payload.slabDiametreBMm)
        ? payload.slabDiametreBMm
        : fallbackDia;

    return [
      { dia: diaA, qtyM: qtyA },
      { dia: diaB, qtyM: qtyB },
    ];
  }

  return null;
}

function normalizePayloadDiameters(payload: TotalRowModalPayload, mms: number[]) {
  const fallbackDia = mms[0] ?? 6;
  const pick = (d: number | null | undefined) =>
    typeof d === "number" && mms.includes(d) ? d : fallbackDia;

  const extraFormes = (payload.extraFormes ?? []).map((x) => ({
    ...x,
    diametreMm: pick(x.diametreMm),
  }));

  const extraBoxes = (payload.extraBoxes ?? []).map((b) => ({
    ...b,
    diametreMm: pick(b.diametreMm),
  }));

  return {
    ...payload,
    typeName: payload.typeName ?? "",
    forme: payload.forme ?? "BARRE",
    nb: payload.nb ?? null,
    diametreMm: pick(payload.diametreMm),
    extraFormes,
    extraBoxes,
  };
}

function computeQtyPoidsByMmFromPayload(payloadIn: TotalRowModalPayload, mms: number[]) {
  const payload = normalizePayloadDiameters(payloadIn, mms);

  const qtyByMm = buildZerosByMm(mms);
  const poidsByMm = buildZerosByMm(mms);

  const nb = payload.nb ?? 0;
  const h = payload.hauteur ?? 0;
  const isSlabPayload = isSlabDesignationName(payload.designation);
  const isSlabSurfacePerM2SpacingPayload =
    isSlabSurfacePerM2SpacingDesignationName(payload.designation);

  const addQty = (dia: number, qtyM: number) => {
    if (!Number.isFinite(qtyM) || qtyM <= 0) return;
    if (!(dia in qtyByMm)) return;
    qtyByMm[dia] = (qtyByMm[dia] ?? 0) + qtyM;
  };

  const handleBarre = (dia: number, nBarre: number, ancrage: number, attente: number) => {
    const qtyM = nb * (nBarre * (h + attente + ancrage));
    addQty(dia, qtyM);
  };

  const handleCadre = (forme: Exclude<RowForme, "BARRE">, dia: number, longueur: number, largeur: number, diamCercle: number, ancrage: number, espacement: number) => {
    const per = computeCadrePerimetreNum(forme, longueur, largeur, diamCercle, ancrage);
    const ratio = espacement > 0 ? h / espacement : 0;
    const qtyM = nb * per * ratio;
    addQty(dia, qtyM);
  };

  const mainDia = payload.diametreMm;

  if (payload.forme === "BARRE") {
    const slabQtyEntries = isSlabPayload
      ? computeSlabSpacingQtyEntriesFromPayload(
          payload,
          nb,
          mainDia,
          isSlabSurfacePerM2SpacingPayload,
        )
      : null;
    if (slabQtyEntries) slabQtyEntries.forEach((entry) => addQty(entry.dia, entry.qtyM));
    else handleBarre(mainDia, payload.nBarre ?? 0, payload.ancrage ?? 0, payload.attenteBarre ?? 0);
  } else {
    handleCadre(
      payload.forme,
      mainDia,
      payload.longueur ?? 0,
      payload.largeur ?? 0,
      payload.rayon ?? 0,
      payload.ancrage ?? 0,
      payload.espacement ?? 0,
    );
  }

  for (const x of payload.extraFormes ?? []) {
    const dia = x.diametreMm;
    if (x.forme === "BARRE") {
      const fallbackDia = typeof dia === "number" && Number.isFinite(dia) ? dia : mainDia;
      const slabQtyEntries = isSlabPayload
        ? computeSlabSpacingQtyEntriesFromPayload(
            x,
            nb,
            fallbackDia,
            isSlabSurfacePerM2SpacingPayload,
          )
        : null;
      if (slabQtyEntries) slabQtyEntries.forEach((entry) => addQty(entry.dia, entry.qtyM));
      else handleBarre(dia, x.nBarre ?? 0, x.ancrage ?? 0, x.attenteBarre ?? 0);
    } else {
      handleCadre(
        x.forme as Exclude<RowForme, "BARRE">,
        dia,
        x.longueur ?? 0,
        x.largeur ?? 0,
        x.rayon ?? 0,
        x.ancrage ?? 0,
        x.espacement ?? 0,
      );
    }
  }

  for (const b of payload.extraBoxes ?? []) {
    const dia = b.diametreMm;
    const per = computeExtraPerimetreNum(b.kind, b.longueur ?? 0, b.ancrage ?? 0);
    const esp = b.espacement ?? 0;
    const ratio = esp > 0 ? h / esp : 0;
    const qtyM = nb * ((b.n ?? 0) * per) * ratio;
    addQty(dia, qtyM);
  }

  for (const mm of mms) {
    const q = qtyByMm[mm] ?? 0;
    const t = safeDivide(q * kgPerMeter(mm), 1000);
    poidsByMm[mm] = Number.isFinite(t) && t > 0 ? t : 0;
  }

  return { qtyByMm, poidsByMm, payload };
}

function SousTraitantsField({
  niveauId,
  inputClass,
  draftValue,
  setDraftValue,
  items,
  onAdd,
  onRemove,
}: {
  niveauId: string;
  inputClass: string;
  draftValue: string;
  setDraftValue: (v: string) => void;
  items: string[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={wrapRef} className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          className={inputClass}
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          placeholder="Ex: Ste. AM SIOUD CONSTRUCTION"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />

        {open ? (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 w-full rounded-md border border-emerald-200 bg-white shadow-lg" role="listbox">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-700 border-b border-gray-100">
              Entreprise - Mains d'oeuvres ({items.length})
            </div>

            <div className="max-h-60 overflow-auto py-1">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">—</div>
              ) : (
                items.map((st, idx) => (
                  <div key={`${niveauId}-st-${idx}`} className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-emerald-50">
                    <div className="text-sm text-gray-800 truncate">{st || "—"}</div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      title="Supprimer"
                      aria-label="Supprimer"
                      onClick={() => onRemove(idx)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>

      <button type="button" className="ButtonSquare" title="Ajouter entreprise" aria-label="Ajouter entreprise" onClick={onAdd}>
        <LuPlus size={16} />
      </button>

      <button
        type="button"
        className="ButtonSquare"
        title="Liste des entreprises"
        aria-label="Liste des entreprises"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <IoIosArrowDropup size={18} /> : <IoIosArrowDropdown size={18} />}
      </button>
    </div>
  );
}

function NiveauModal({
  open,
  onClose,
  onSubmit,
  inputClass,
  initial,
  submitting = false,
  errorMessage,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => void | Promise<void>;
  inputClass: string;
  initial: { id: string; niveauName: string; note: string; sousTraitants: string[]; diametres: number[] };
  submitting?: boolean;
  errorMessage?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isEdit = initial.id !== "add";

  const [draftSous, setDraftSous] = useState("");
  const [local, setLocal] = useState<{
    id: string;
    name: string;
    note: string;
    selectedMms: number[];
    sousTraitants: string[];
  }>(() => ({
    id: initial.id,
    name: initial.niveauName ?? "",
    note: initial.note ?? "",
    selectedMms: (initial.diametres?.length ? initial.diametres : [...DEFAULT_MMS]).slice().sort((a, b) => a - b),
    sousTraitants: initial.sousTraitants ?? [],
  }));

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

  const toggleMm = (mm: number) => {
    setLocal((p) => {
      const set = new Set<number>(p.selectedMms ?? []);
      if (set.has(mm)) set.delete(mm);
      else set.add(mm);
      return { ...p, selectedMms: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const addEntreprise = () => {
    const raw = draftSous.trim();
    if (!raw) return;

    setLocal((p) => {
      const current = p.sousTraitants ?? [];
      if (current.includes(raw)) return p;
      return { ...p, sousTraitants: [...current, raw] };
    });

    setDraftSous("");
  };

  const removeEntreprise = (idx: number) => {
    setLocal((p) => ({ ...p, sousTraitants: (p.sousTraitants ?? []).filter((_, i) => i !== idx) }));
  };

  const nameOk = (local.name ?? "").trim().length > 0;
  const mmsOk = (local.selectedMms ?? []).length > 0;
  const canSubmit = nameOk && mmsOk;

  const submit = () => {
    if (!canSubmit) return;
    void onSubmit({
      niveauName: (local.name ?? "").trim(),
      note: (local.note ?? "").trim(),
      sousTraitants: local.sousTraitants ?? [],
      diametres: (local.selectedMms ?? []).sort((a, b) => a - b),
    });
  };

  return (
    <NiveauModalWindow
      open={open}
      title={isEdit ? "Mettre a jour niveau" : "Ajouter Niveau"}
      panelRef={panelRef}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      inputClass={inputClass}
      nameValue={local.name}
      onNameChange={(v) => setLocal((p) => ({ ...p, name: v }))}
      noteValue={local.note}
      onNoteChange={(v) => setLocal((p) => ({ ...p, note: v }))}
      sousTraitantsField={
        <SousTraitantsField
          niveauId={local.id}
          inputClass={inputClass}
          draftValue={draftSous}
          setDraftValue={setDraftSous}
          items={local.sousTraitants ?? []}
          onAdd={addEntreprise}
          onRemove={(idx) => removeEntreprise(idx)}
        />
      }
      standardMms={STANDARD_MMS}
      selectedMms={local.selectedMms ?? []}
      onToggleMm={toggleMm}
      onSubmit={submit}
      submitLabel={isEdit ? "Mettre a jour" : "Ajouter"}
      canSubmit={canSubmit}
      nameInvalid={!nameOk}
      mmsInvalid={!mmsOk}
      submitting={submitting}
      errorMessage={errorMessage}
    />
  );
}

export default function EditCalculeTotalFerraillage({
  initialData,
  onNiveauCreated,
  onLineCreated,
  onLineUpdated,
  onLineDeleted,
}: EditCalculeTotalFerraillageProps) {
  const [data, setData] = useState<TotalFerraillageData>(() => initialData ?? EMPTY_TOTAL_FERRAILLAGE);

  const [openAdd, setOpenAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [rowModal, setRowModal] = useState<{ mode: "add" | "edit"; niveauId: string; rowId?: string } | null>(null);
  const [rowDeleteTarget, setRowDeleteTarget] = useState<{ niveauId: string; rowId: string; itemName: string } | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [rowSubmitting, setRowSubmitting] = useState(false);
  const [rowErr, setRowErr] = useState("");
  const [rowDeleteLoading, setRowDeleteLoading] = useState(false);
  const [rowDeleteErr, setRowDeleteErr] = useState("");

  useEffect(() => {
    setData(initialData ?? EMPTY_TOTAL_FERRAILLAGE);
    setOpenAdd(false);
    setEditId(null);
    setRowModal(null);
    setRowDeleteTarget(null);
    setAddSubmitting(false);
    setAddErr("");
    setRowSubmitting(false);
    setRowErr("");
    setRowDeleteLoading(false);
    setRowDeleteErr("");
  }, [initialData]);

  const inputClass =
    "form-control w-full rounded-md border text-xs font-medium truncate " +
    "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 " +
    "border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 " +
    "placeholder:text-emerald-800/60";

  const editingNiveau = useMemo(() => {
    if (!editId) return null;
    return (data.niveaux ?? []).find((n) => n.id === editId) ?? null;
  }, [editId, data.niveaux]);

  const openEdit = Boolean(editId && editingNiveau);

  const rowEditingNiveau = useMemo(() => {
    if (!rowModal) return null;
    return (data.niveaux ?? []).find((n) => n.id === rowModal.niveauId) ?? null;
  }, [rowModal, data.niveaux]);

  const rowEditingRow = useMemo(() => {
    if (!rowModal || rowModal.mode !== "edit" || !rowModal.rowId) return null;
    return rowEditingNiveau?.rows?.find((r) => r.id === rowModal.rowId) ?? null;
  }, [rowModal, rowEditingNiveau]);

  const rowModalMms = useMemo(() => {
    const arr = rowEditingNiveau?.diametres?.length ? rowEditingNiveau.diametres : DEFAULT_MMS;
    return [...arr].sort((a, b) => a - b);
  }, [rowEditingNiveau]);

  const removeNiveau = (id: string) => {
    setEditId((curr) => (curr === id ? null : curr));
    setData((p) => ({ ...p, niveaux: (p.niveaux ?? []).filter((x) => x.id !== id) }));
  };

  const addFromModal = async (payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => {
    const projectId = String(data.rapportId ?? "").trim();
    if (!projectId) {
      setAddErr("Projet introuvable.");
      return;
    }

    setAddSubmitting(true);
    setAddErr("");

    try {
      const response = await ferraillageApi.createProjectNiveau(projectId, {
        nomNiveau: payload.niveauName,
        note: payload.note || null,
        entreprisesMainsOeuvres: payload.sousTraitants ?? [],
        diametresActifs: (payload.diametres?.length ? payload.diametres : [...DEFAULT_MMS]).sort((a, b) => a - b),
      });

      if (onNiveauCreated) {
        onNiveauCreated(response.item);
      } else {
        const created = mapProjectNiveauToLocal(response.item);
        setData((p) => ({
          ...p,
          niveaux: [...(p.niveaux ?? []), created],
        }));
      }

      setOpenAdd(false);
      setAddErr("");
    } catch (error: unknown) {
      setAddErr(isFerApiError(error) ? error.message : "Echec de l'enregistrement du niveau");
    } finally {
      setAddSubmitting(false);
    }
  };

  const updateFromModal = (id: string, payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => {
    setData((p) => ({
      ...p,
      niveaux: (p.niveaux ?? []).map((n) => {
        if (n.id !== id) return n;
        const diametres = (payload.diametres?.length ? payload.diametres : n.diametres?.length ? n.diametres : [...DEFAULT_MMS]).sort((a, b) => a - b);
        return { ...n, niveauName: payload.niveauName, note: payload.note, sousTraitants: payload.sousTraitants ?? [], diametres };
      }),
    }));
  };

  const allMms = useMemo(() => {
    const set = new Set<number>();
    for (const n of data.niveaux ?? []) for (const mm of n.diametres ?? []) set.add(mm);
    const out = Array.from(set).sort((a, b) => a - b);
    return out.length ? out : [...DEFAULT_MMS];
  }, [data.niveaux]);

  const addRowToNiveau = async (niveauId: string, payload: TotalRowModalPayload) => {
    const projectId = String(data.rapportId ?? "").trim();
    if (!projectId) {
      setRowErr("Projet introuvable.");
      return;
    }

    const targetNiveau = (data.niveaux ?? []).find((niveau) => niveau.id === niveauId);
    const mms = [...(targetNiveau?.diametres?.length ? targetNiveau.diametres : DEFAULT_MMS)].sort((a, b) => a - b);
    const { qtyByMm, poidsByMm, payload: normalizedPayload } = computeQtyPoidsByMmFromPayload(payload, mms);

    setRowSubmitting(true);
    setRowErr("");

    try {
      const response = await ferraillageApi.createProjectNiveauLine(projectId, niveauId, {
        designation: normalizedPayload.designation,
        nomenclature: normalizedPayload.typeName ?? null,
        nb: normalizedPayload.nb ?? null,
        hauteur: normalizedPayload.hauteur ?? null,
        forme: normalizedPayload.forme ?? null,
        diametreMm: normalizedPayload.diametreMm ?? null,
        payload: normalizedPayload as unknown as Record<string, unknown>,
        qtyByMm,
        poidsByMm,
      });

      if (onLineCreated) {
        onLineCreated(niveauId, response.item);
      } else {
        const row = mapProjectLineToLocal(response.item);
        setData((p) => ({
          ...p,
          niveaux: (p.niveaux ?? []).map((n) => (n.id !== niveauId ? n : { ...n, rows: [...(n.rows ?? []), row] })),
        }));
      }

      setRowModal(null);
      setRowErr("");
    } catch (error: unknown) {
      setRowErr(isFerApiError(error) ? error.message : "Echec de l'enregistrement de la ligne");
    } finally {
      setRowSubmitting(false);
    }
  };

  const updateRowInNiveau = async (niveauId: string, rowId: string, payload: TotalRowModalPayload) => {
    const projectId = String(data.rapportId ?? "").trim();
    if (!projectId) {
      setRowErr("Projet introuvable.");
      return;
    }

    const targetNiveau = (data.niveaux ?? []).find((niveau) => niveau.id === niveauId);
    const mms = [...(targetNiveau?.diametres?.length ? targetNiveau.diametres : DEFAULT_MMS)].sort((a, b) => a - b);
    const { qtyByMm, poidsByMm, payload: normalizedPayload } = computeQtyPoidsByMmFromPayload(payload, mms);

    setRowSubmitting(true);
    setRowErr("");

    try {
      const response = await ferraillageApi.updateProjectLine(rowId, {
        projectId,
        niveauId,
        designation: normalizedPayload.designation,
        nomenclature: normalizedPayload.typeName ?? null,
        nb: normalizedPayload.nb ?? null,
        hauteur: normalizedPayload.hauteur ?? null,
        forme: normalizedPayload.forme ?? null,
        diametreMm: normalizedPayload.diametreMm ?? null,
        payload: normalizedPayload as unknown as Record<string, unknown>,
        qtyByMm,
        poidsByMm,
      });

      if (onLineUpdated) {
        onLineUpdated(niveauId, response.item);
      } else {
        const row = mapProjectLineToLocal(response.item);
        setData((current) => ({
          ...current,
          niveaux: (current.niveaux ?? []).map((niveau) =>
            niveau.id !== niveauId
              ? niveau
              : {
                  ...niveau,
                  rows: (niveau.rows ?? []).map((item) => (item.id === rowId ? row : item)),
                },
          ),
        }));
      }

      setRowModal(null);
      setRowErr("");
    } catch (error: unknown) {
      setRowErr(isFerApiError(error) ? error.message : "Echec de la modification de la ligne");
    } finally {
      setRowSubmitting(false);
    }
  };

  const deleteRowFromNiveau = async () => {
    if (!rowDeleteTarget) return;

    const projectId = String(data.rapportId ?? "").trim();
    if (!projectId) {
      setRowDeleteErr("Projet introuvable.");
      return;
    }

    setRowDeleteLoading(true);
    setRowDeleteErr("");

    try {
      await ferraillageApi.deleteProjectLine(rowDeleteTarget.rowId, {
        projectId,
        niveauId: rowDeleteTarget.niveauId,
      });

      if (onLineDeleted) {
        onLineDeleted(rowDeleteTarget.niveauId, rowDeleteTarget.rowId);
      } else {
        setData((current) => ({
          ...current,
          niveaux: (current.niveaux ?? []).map((niveau) =>
            niveau.id !== rowDeleteTarget.niveauId
              ? niveau
              : {
                  ...niveau,
                  rows: (niveau.rows ?? []).filter((row) => row.id !== rowDeleteTarget.rowId),
                },
          ),
        }));
      }

      setRowDeleteTarget(null);
      setRowDeleteErr("");
    } catch (error: unknown) {
      setRowDeleteErr(isFerApiError(error) ? error.message : "Echec de la suppression de la ligne");
    } finally {
      setRowDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <button
          type="button"
          className="btn-fit-white-outline"
          onClick={() => {
            setAddErr("");
            setOpenAdd(true);
          }}
          disabled={!data.rapportId}
        >
          Ajouter Niveau
        </button>
      </div>

      {openAdd ? (
        <NiveauModal
          open={openAdd}
          onClose={() => {
            if (addSubmitting) return;
            setAddErr("");
            setOpenAdd(false);
          }}
          onSubmit={addFromModal}
          inputClass={inputClass}
          initial={{ id: "add", niveauName: "", note: "", sousTraitants: [], diametres: [] }}
          submitting={addSubmitting}
          errorMessage={addErr}
        />
      ) : null}

      {openEdit && editingNiveau ? (
        <NiveauModal
          key={editingNiveau.id}
          open={openEdit}
          onClose={() => setEditId(null)}
          onSubmit={(payload: { niveauName: string; note: string; sousTraitants: string[]; diametres: number[] }) => {
            updateFromModal(editingNiveau.id, payload);
            setEditId(null);
          }}
          inputClass={inputClass}
          initial={{
            id: editingNiveau.id,
            niveauName: editingNiveau.niveauName ?? "",
            note: editingNiveau.note ?? "",
            sousTraitants: editingNiveau.sousTraitants ?? [],
            diametres: editingNiveau.diametres ?? [],
          }}
        />
      ) : null}

      {rowModal ? (
        <TotalRowModalWindow
          key={`${rowModal.mode}-${rowModal.niveauId}-${rowModal.rowId ?? "add"}`}
          open
          title={rowModal.mode === "edit" ? "Modifier une ligne" : "Ajouter une ligne"}
          submitLabel={rowModal.mode === "edit" ? "Modifier" : "Ajouter"}
          inputClass={inputClass}
          mms={rowModalMms}
          initial={
            rowModal.mode === "edit" && rowEditingRow?.payload
              ? rowEditingRow.payload
              : rowModal.mode === "edit" && rowEditingRow
                ? {
                    designation: rowEditingRow.designation ?? "",
                    typeName: rowEditingRow.typeName ?? "",
                    nb: rowEditingRow.nb,
                    hauteur: null,
                    enrobage: null,
                    forme: rowEditingRow.forme ?? "BARRE",
                    diametreMm: rowEditingRow.diametre,
                  }
                : {
                    designation: "",
                    typeName: "",
                    nb: null,
                    hauteur: null,
                    enrobage: null,
                    forme: "BARRE",
                    diametreMm: rowModalMms[0] ?? 0,
                  }
          }
          onClose={() => {
            if (rowSubmitting) return;
            setRowErr("");
            setRowModal(null);
          }}
          submitting={rowSubmitting}
          errorMessage={rowErr}
          onSubmit={async (payload: TotalRowModalPayload) => {
            if (rowModal.mode === "edit" && rowModal.rowId) {
              await updateRowInNiveau(rowModal.niveauId, rowModal.rowId, payload);
              return;
            }
            await addRowToNiveau(rowModal.niveauId, payload);
          }}
        />
      ) : null}

      <DeleteConfirmModal
        open={Boolean(rowDeleteTarget)}
        title="Supprimer la ligne"
        itemName={rowDeleteTarget?.itemName ?? ""}
        message={rowDeleteErr || "sera definitivement supprimee."}
        loading={rowDeleteLoading}
        onConfirm={() => void deleteRowFromNiveau()}
        onCancel={() => {
          if (rowDeleteLoading) return;
          setRowDeleteTarget(null);
          setRowDeleteErr("");
        }}
      />

      {(data.niveaux ?? []).map((niv) => (
        <NiveauBlock
          key={niv.id}
          niveau={niv}
          onEdit={() => setEditId(niv.id)}
          onDelete={() => removeNiveau(niv.id)}
          onAddRow={() => {
            setRowErr("");
            setRowModal({ mode: "add", niveauId: niv.id });
          }}
          onEditRow={(rowId: string) => {
            setRowErr("");
            setRowModal({ mode: "edit", niveauId: niv.id, rowId });
          }}
          onDeleteRow={(rowId: string) => {
            const row = (niv.rows ?? []).find((item) => item.id === rowId);
            if (!row) return;
            const itemName = [row.designation, row.typeName].filter(Boolean).join(" - ") || "Ligne";
            setRowDeleteErr("");
            setRowDeleteTarget({ niveauId: niv.id, rowId, itemName });
          }}
        />
      ))}

      {(data.niveaux ?? []).length ? <RecapByNiveau niveaux={data.niveaux ?? []} allMms={allMms} /> : null}
    </div>
  );
}

function RecapByNiveau({ niveaux, allMms }: { niveaux: NiveauTotal[]; allMms: number[] }) {
  const rows = useMemo(() => {
    return niveaux.map((n) => ({
      id: n.id,
      name: n.niveauName || "—",
      totals: computeTotals(n.rows ?? [], allMms),
    }));
  }, [niveaux, allMms]);

  const grandTotals = useMemo(() => {
    const allRows = niveaux.flatMap((n) => n.rows ?? []);
    return computeTotals(allRows, allMms);
  }, [niveaux, allMms]);

  const sumPoidsAll = useMemo(() => allMms.reduce((s, mm) => s + (grandTotals.poids[mm] ?? 0), 0), [allMms, grandTotals]);

  return (
    <div className="bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="w-full text-xs font-bold text-gray-900 text-center align-middle items-center uppercase">Récapitulatif par niveau</div>
      </div>

      <div className="p-4">
        <div className="relative overflow-auto">
          <table className="border-collapse table-fixed w-full min-w-350">
            <thead>
              <tr className="bg-emerald-700 text-white">
                <th className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-70" rowSpan={2}>
                  Niveau
                </th>
                <th className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={allMms.length}>
                  Quantités <span className="text-[10px] font-semibold normal-case">(en mètre)</span>
                </th>
                <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={allMms.length}>
                  Poids <span className="text-[10px] font-semibold normal-case">(en tonnes)</span>
                </th>
              </tr>

              <tr className="bg-emerald-700 text-white">
                {allMms.map((mm) => (
                  <th key={`rq-h-${mm}`} className="border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25">
                    Fer {mm} (m)
                  </th>
                ))}

                {allMms.map((mm, idx) => (
                  <th
                    key={`rp-h-${mm}`}
                    className={[
                      "py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25",
                      idx < allMms.length - 1 ? "border-r-2 border-emerald-600" : "",
                    ].join(" ")}
                  >
                    Fer {mm} (T)
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                  <td className="py-2 px-2 text-xs border-r-2 border-emerald-100">
                    <div className="whitespace-pre-wrap wrap-break-word font-semibold text-gray-900">{r.name}</div>
                  </td>

                  {allMms.map((mm) => (
                    <td key={`rq-${r.id}-${mm}`} className="py-2 text-center text-xs border-r-2 border-emerald-100">
                      {fmtNumTrim3(r.totals.qty[mm] ?? 0)}
                    </td>
                  ))}

                  {allMms.map((mm, i2) => (
                    <td
                      key={`rp-${r.id}-${mm}`}
                      className={["py-2 text-center text-xs", i2 < allMms.length - 1 ? "border-r-2 border-emerald-100" : ""].join(" ")}
                    >
                      {fmtNumTrim3(r.totals.poids[mm] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}

              <tr className="bg-emerald-700 text-white">
                <td className="sticky bottom-0 z-30 bg-emerald-700 text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2 border-emerald-600">
                  Total global
                </td>

                {allMms.map((mm) => (
                  <td
                    key={`gtq-${mm}`}
                    className="sticky bottom-0 z-30 bg-emerald-700 text-white border-r-2 border-emerald-600 py-2 text-[11px] font-semibold text-center uppercase tracking-wide"
                  >
                    {fmtNumTrim3(grandTotals.qty[mm] ?? 0)}
                  </td>
                ))}

                {allMms.map((mm, idx2) => (
                  <td
                    key={`gtp-${mm}`}
                    className={[
                      "sticky bottom-0 z-30 bg-emerald-700 text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide",
                      idx2 < allMms.length - 1 ? "border-r-2 border-emerald-600" : "",
                    ].join(" ")}
                  >
                    {fmtNumTrim3(grandTotals.poids[mm] ?? 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 border border-emerald-100">
            <span className="font-semibold">Total Poids (tous Ø)</span>
            <span>{fmtNumTrim3(sumPoidsAll)} T</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NiveauBlock({
  niveau,
  onEdit,
  onDelete,
  onAddRow,
  onEditRow,
  onDeleteRow,
}: {
  niveau: NiveauTotal;
  onEdit: () => void;
  onDelete: () => void;
  onAddRow: () => void;
  onEditRow: (rowId: string) => void;
  onDeleteRow: (rowId: string) => void;
}) {
  const mms = useMemo(() => [...(niveau.diametres?.length ? niveau.diametres : DEFAULT_MMS)].sort((a, b) => a - b), [niveau.diametres]);
  const totals = useMemo(() => computeTotals(niveau.rows ?? [], mms), [niveau.rows, mms]);

  const stickyTotalH = 40;
  const colSpan = 3 + 2 * mms.length;

  return (
    <div className="bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600">Niveau</span>
              <span className="text-xs font-semibold text-gray-900">{niveau.niveauName || "—"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="ButtonSquare" title="Modifier" onClick={onEdit}>
                <FaRegEdit size={14} />
              </button>

              <button type="button" onClick={onDelete} className="ButtonSquareDelete" title="Supprimer">
                <FaTrashAlt size={14} />
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="w-1/2 flex items-start gap-2 px-3 py-2">
              <span className="mt-0.5 inline-flex items-center rounded-md bg-gray-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                Note
              </span>
              <div className="text-xs text-gray-700 leading-relaxed">{niveau.note || "—"}</div>
            </div>

            <div className="w-1/2 flex flex-col items-end gap-1 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-900">Entreprise - Mains d'oeuvres</span>

              {niveau.sousTraitants?.length ? (
                <ul className="list-disc list-inside text-xs text-gray-700 leading-relaxed space-y-0.5">
                  {niveau.sousTraitants.map((st, idx) => (
                    <li key={`${idx}-${st}`} className="wrap-break-word">
                      {st}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-gray-700">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="relative overflow-auto pb-10">
          <table className="border-collapse table-fixed w-full min-w-350">
            <thead>
              <tr className="bg-(--primary) text-white">
                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-70" rowSpan={2}>
                  Designations
                </th>

                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75" rowSpan={2}>
                  NB
                </th>

                <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={mms.length}>
                  Quantités <span className="text-[10px] font-semibold normal-case">(en mètre)</span>
                </th>

                <th className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide" colSpan={mms.length}>
                  Poids <span className="text-[10px] font-semibold normal-case">(en tonnes)</span>
                </th>

                <th className="border-l-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-26" rowSpan={2}>
                  Actions
                </th>
              </tr>

              <tr className="bg-(--primary) text-white">
                {mms.map((mm) => (
                  <th key={`q-${niveau.id}-${mm}`} className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25">
                    Fer {mm} (m)
                  </th>
                ))}

                {mms.map((mm, idx) => (
                  <th
                    key={`p-${niveau.id}-${mm}`}
                    className={["py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-21.25", idx < mms.length - 1 ? "border-r-2" : ""].join(" ")}
                  >
                    Fer {mm} (T)
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(niveau.rows ?? []).length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={colSpan} className="py-8 text-center text-gray-600">
                    Aucune ligne.
                  </td>
                </tr>
              ) : (
                (niveau.rows ?? []).map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx % 2 === 0 ? "bg-white cursor-pointer" : "bg-gray-100 cursor-pointer"}
                    onDoubleClick={() => onEditRow(row.id)}
                    title="Double clic pour modifier"
                  >
                    <td className="py-2 px-2 text-xs border-r-2">
                      <div className="whitespace-pre-wrap wrap-break-word">
                        <div className="font-semibold">{row.designation || "—"}</div>
                        <div className="text-[11px] text-gray-600">{row.typeName || "—"}</div>
                      </div>
                    </td>

                    <td className="py-2 text-center text-xs border-r-2">{row.nb == null ? "" : fmtNumTrim3(row.nb)}</td>

                    {mms.map((mm) => (
                      <td key={`rq-${row.id}-${mm}`} className="py-2 text-center text-xs border-r-2">
                        {cellVal(row.qtyByMm, mm)}
                      </td>
                    ))}

                    {mms.map((mm, i2) => (
                      <td key={`rp-${row.id}-${mm}`} className={["py-2 text-center text-xs", i2 < mms.length - 1 ? "border-r-2" : ""].join(" ")}>
                        {cellVal(row.poidsByMm, mm)}
                      </td>
                    ))}

                    <td className="py-2 px-2 border-l-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="ButtonSquare"
                          title="Modifier la ligne"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditRow(row.id);
                          }}
                        >
                          <FaRegEdit size={14} />
                        </button>

                        <button
                          type="button"
                          className="ButtonSquareDelete"
                          title="Supprimer la ligne"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteRow(row.id);
                          }}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              <AddRowInsideTable colSpan={colSpan} bottomOffsetPx={stickyTotalH} onClick={onAddRow} text="Ajouter une ligne" />

              <tr className="bg-(--primary) text-white">
                <td colSpan={2} className="sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide border-r-2">
                  Total
                </td>

                {mms.map((mm) => (
                  <td
                    key={`tq-${niveau.id}-${mm}`}
                    className="sticky bottom-0 z-30 bg-(--primary) text-white border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide"
                  >
                    {fmtNumTrim3(totals.qty[mm] ?? 0)}
                  </td>
                ))}

                {mms.map((mm, idx2) => (
                  <td
                    key={`tp-${niveau.id}-${mm}`}
                    className={[
                      "sticky bottom-0 z-30 bg-(--primary) text-white py-2 text-[11px] font-semibold text-center uppercase tracking-wide",
                      idx2 < mms.length - 1 ? "border-r-2" : "",
                    ].join(" ")}
                  >
                    {fmtNumTrim3(totals.poids[mm] ?? 0)}
                  </td>
                ))}

                <td className="sticky bottom-0 z-30 bg-(--primary) text-white border-l-2" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
