import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import { FaSpinner } from "react-icons/fa6";
import {
  ferraillageApi,
  isApiError as isFerApiError,
  type FerRapportDTO,
} from "@/lib/ferraillageApi";

import DetailsProjetPF from "./StepsPF/DetailsProjetPF";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (item: FerRapportDTO) => void | Promise<void>;
};

export type AcierType = "F400" | "F500";

export type ProjectWizardData = {
  chantierName: string;
  responsable: string;
  acierType: AcierType;
  note: string;
};

const INITIAL_DATA: ProjectWizardData = {
  chantierName: "",
  responsable: "",
  acierType: "F500",
  note: "",
};

function normalizeWizardData(data: ProjectWizardData) {
  return {
    chantierName: data.chantierName.trim(),
    responsable: data.responsable.trim(),
    acierType: data.acierType,
    note: data.note.trim(),
  };
}

function getValidationError(data: ReturnType<typeof normalizeWizardData>) {
  if (!data.chantierName) return "Le chantier est obligatoire.";
  return null;
}

export default function CreateProjetWizard({ open, onClose, onCreated }: Props) {
  const [data, setData] = useState<ProjectWizardData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => {
      setData(INITIAL_DATA);
      setSubmitting(false);
      setErr("");
    }, 0);

    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && !submitting) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const normalized = useMemo(() => normalizeWizardData(data), [data]);
  const validationError = useMemo(() => getValidationError(normalized), [normalized]);

  useEffect(() => {
    if (err) setErr("");
  }, [normalized]);

  const submitProject = async () => {
    if (submitting) return;
    if (validationError) {
      setErr(validationError);
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      const response = await ferraillageApi.createProject({
        chantierName: normalized.chantierName,
        responsable: normalized.responsable || null,
        acierType: normalized.acierType,
        note: normalized.note || null,
      });

      await onCreated?.(response.item);
      onClose();
    } catch (error: unknown) {
      setErr(isFerApiError(error) ? error.message : "Project creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const closeOnBackdrop = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (submitting) return;
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-99">
      <div className="absolute inset-0 bg-black/40" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-4xl max-h-[95vh] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
        >
          <div className="px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-900">Creer Projet</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
              disabled={submitting}
              className="p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <CiCircleRemove size={28} />
            </button>
          </div>

          {err ? <div className="px-5 -mt-2 text-sm text-red-600">{err}</div> : null}

          <div className="px-5 py-4 overflow-auto">
            <DetailsProjetPF data={data} setData={setData} />
          </div>

          <div
            className="
              rounded-b-xl bg-gray-50
              border-t border-slate-900/10
              px-3.5 pt-2.5 pb-3.5
              flex items-center justify-between gap-3
            "
            aria-label="Navigation entre les etapes du modele"
          >
            <div className="flex items-center justify-start gap-2 flex-1">
              <button type="button" onClick={onClose} className="stepper__nav" id="modelCancelFlowBtn" disabled={submitting}>
                Annuler
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap">
              <button type="button" onClick={() => void submitProject()} className="stepper__nav" disabled={submitting} aria-label="Creer le projet">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  "Terminer"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
