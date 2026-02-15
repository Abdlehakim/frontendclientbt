import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";
import { CiCircleRemove } from "react-icons/ci";
import Stepper from "@/components/Stepper";
import { attFerraillageApi, isApiError as isFerApiError } from "@/lib/attFerraillageApi";

import StepProjetDiametres from "./stepsRapport/StepProjetDiametres";
import StepRapportAttachement from "./stepsRapport/StepRapportAttachement";
import StepCalculeQuantite from "./stepsRapport/StepCalculeQuantite";
import StepAvancesPaiement from "./stepsRapport/StepAvancesPaiement";
import StepVerificationFinale from "./stepsRapport/StepVerificationFinale";

import type { WizardData } from "@/types/wizard";
export type { WizardData } from "@/types/wizard";

type Props = {
  open: boolean;
  onClose: () => void;
};

const STEPS = [
  "Projet & Diamètres",
  "Rapport d'attachement",
  "Calcule de Quantité",
  "Avances de paiement",
  "Vérification & Calcule finale",
] as const;

function rangeInts(a: number, b: number) {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

function uniqSorted(nums: number[]) {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

const INITIAL_DATA: WizardData = {
  chantierName: "",
  sousTraitant: "",
  acierType: "F500",
  selectedMms: [],
};

export default function CreateRapportWizard({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  const [data, setData] = useState<WizardData>(INITIAL_DATA);

  const [extraMms, setExtraMms] = useState<number[]>([]);
  const [loadingDiam, setLoadingDiam] = useState(false);
  const [err, setErr] = useState("");

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => {
      setStep(0);
      setExtraMms([]);
      setErr("");
      setData(INITIAL_DATA);
    }, 0);

    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setLoadingDiam(true);
    });

    attFerraillageApi
      .listDiametres()
      .then(() => {
        if (cancelled) return;
        setErr("");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(isFerApiError(e) ? e.message : "Failed to load diamètres");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingDiam(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const baseMms = useMemo(() => rangeInts(5, 21), []);
  const baseSet = useMemo(() => new Set(baseMms), [baseMms]);

  const knownMms = useMemo(() => uniqSorted([...baseMms, ...extraMms]), [baseMms, extraMms]);
  const firstMm = knownMms.length ? knownMms[0] : 5;
  const lastMm = knownMms.length ? knownMms[knownMms.length - 1] : 21;

  const canRemoveFirst = !baseSet.has(firstMm);
  const canRemoveLast = !baseSet.has(lastMm);

  const selectedSet = useMemo(() => new Set<number>(data.selectedMms), [data.selectedMms]);

  const toggleMm = (mm: number) => {
    setData((prev) => {
      const set = new Set(prev.selectedMms);
      if (set.has(mm)) set.delete(mm);
      else set.add(mm);
      return { ...prev, selectedMms: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const addPrevLabelOnly = () => {
    setExtraMms((prev) => {
      const current = new Set<number>([...baseMms, ...prev]);

      let minV = Infinity;
      for (const v of current) minV = Math.min(minV, v);

      let cand = minV - 1;
      while (cand >= 1 && current.has(cand)) cand--;

      if (cand < 1) return prev;
      return uniqSorted([...prev, cand]);
    });
  };

  const addNextLabelOnly = () => {
    setExtraMms((prev) => {
      const current = new Set<number>([...baseMms, ...prev]);

      let maxV = -Infinity;
      for (const v of current) maxV = Math.max(maxV, v);

      let cand = maxV + 1;
      while (current.has(cand)) cand++;

      return uniqSorted([...prev, cand]);
    });
  };

  const removeLabel = (mm: number) => {
    setExtraMms((prev) => prev.filter((x) => x !== mm));
    setData((prev) => ({ ...prev, selectedMms: prev.selectedMms.filter((x) => x !== mm) }));
  };

  const removeFirstLabelOnly = () => {
    if (!canRemoveFirst) return;
    removeLabel(firstMm);
  };

  const removeLastLabelOnly = () => {
    if (!canRemoveLast) return;
    removeLabel(lastMm);
  };

  const isStepValid = useMemo(() => {
    if (step === 0) {
      return data.selectedMms.length > 0;
    }
    return true;
  }, [step, data.selectedMms.length]);

  const goNext = () => {
    if (!isStepValid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const closeOnBackdrop = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  if (!open) return null;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepProjetDiametres
            data={data}
            setData={setData}
            knownMms={knownMms}
            firstMm={firstMm}
            lastMm={lastMm}
            selectedSet={selectedSet}
            toggleMm={toggleMm}
            addPrevLabelOnly={addPrevLabelOnly}
            removeFirstLabelOnly={removeFirstLabelOnly}
            addNextLabelOnly={addNextLabelOnly}
            removeLastLabelOnly={removeLastLabelOnly}
            canRemoveFirst={canRemoveFirst}
            canRemoveLast={canRemoveLast}
          />
        );
      case 1:
        return <StepRapportAttachement selectedMms={data.selectedMms} />;
      case 2:
        return <StepCalculeQuantite />;
      case 3:
        return <StepAvancesPaiement />;
      case 4:
        return <StepVerificationFinale />;
      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-99">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-[98%] h-[98%] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-900">Créer Rapport</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          <Stepper steps={[...STEPS]} currentStep={step + 1} onStepClick={(n) => setStep(n - 1)} />

          {err ? <div className="px-5 -mt-2 text-sm text-red-600">{err}</div> : null}

          <div className="px-5 py-4 flex-1 overflow-auto">
            {loadingDiam && step === 0 ? (
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                <FaSpinner className="animate-spin" /> Chargement...
              </div>
            ) : null}

            {renderStep()}
          </div>

          <div
            className="
              rounded-b-xl bg-gray-50
              border-t border-slate-900/10
              px-3.5 pt-2.5 pb-3.5
              flex items-center justify-between gap-3
            "
            aria-label="Navigation entre les étapes du modèle"
          >
            <div className="flex items-center justify-start gap-2 flex-1">
              <button type="button" onClick={onClose} className="stepper__nav" id="modelCancelFlowBtn">
                Annuler
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button
                type="button"
                onClick={goBack}
                className="stepper__nav"
                disabled={step === 0}
                aria-label="Aller à l'étape précédente"
                data-model-step-prev=""
              >
                Précédent
              </button>

              <button
                type="button"
                onClick={goNext}
                className="stepper__nav"
                disabled={!isStepValid}
                aria-label="Aller à l'étape suivante"
                data-model-step-next=""
                data-finalize={step === STEPS.length - 1 ? "true" : "false"}
              >
                {step === STEPS.length - 1 ? "Terminer" : "Suivant"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
