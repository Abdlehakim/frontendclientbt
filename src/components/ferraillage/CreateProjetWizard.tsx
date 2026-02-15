// src/components/ferraillage/CreateProjetWizard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import Stepper from "@/components/Stepper";

import DetailsProjetPF from "./StepsPF/DetailsProjetPF";
import NiveauxPF from "./StepsPF/NiveauxPF";

type Props = {
  open: boolean;
  onClose: () => void;
};

export type AcierType = "F400" | "F500";

export type NiveauRow = {
  id: string;
  name: string;
  note: string;
  selectedMms: number[];
  sousTraitants: string[];
};

export type ProjectWizardData = {
  chantierName: string;
  acierType: AcierType;
  note: string;
  niveaux: NiveauRow[];
};

const STEPS = ["Détails projet", "Niveaux"] as const;

const INITIAL_DATA: ProjectWizardData = {
  chantierName: "",
  acierType: "F500",
  note: "",
  niveaux: [],
};

export default function CreateProjetWizard({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProjectWizardData>(INITIAL_DATA);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => {
      setStep(0);
      setData(INITIAL_DATA);
    }, 0);

    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const isStepValid = useMemo(() => {
    if (step === 0) return Boolean(data.chantierName.trim());
    return true;
  }, [step, data.chantierName]);

  const goNext = () => {
    if (!isStepValid) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const closeOnBackdrop = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-99">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className="w-full max-w-[98%] h-[98%] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col">
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-900">Créer Projet</div>
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

          <div className="px-5 py-4 flex-1 overflow-auto">
            {step === 0 ? <DetailsProjetPF data={data} setData={setData} /> : <NiveauxPF data={data} setData={setData} />}
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
              <button type="button" onClick={goBack} className="stepper__nav" disabled={step === 0} aria-label="Aller à l'étape précédente">
                Précédent
              </button>

              <button type="button" onClick={goNext} className="stepper__nav" disabled={!isStepValid} aria-label="Aller à l'étape suivante">
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
