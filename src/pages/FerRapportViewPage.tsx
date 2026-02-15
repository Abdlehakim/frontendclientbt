import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSpinner } from "react-icons/fa6";
import { ferraillageApi, type FerRapportDetailDTO, isApiError as isFerApiError } from "@/lib/ferraillageApi";
import RapportAttachementTab from "@/pages/tabs/RapportAttachementTab";
import CalculeTotalFerraillage from "@/pages/tabs/CalculeTotalFerraillage";

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function maxIso(values: Array<string | null | undefined>) {
  let best: string | null = null;
  for (const v of values) {
    if (!v) continue;
    if (!best) best = v;
    else if (new Date(v).getTime() > new Date(best).getTime()) best = v;
  }
  return best;
}

type TabKey = "TOTAL_FERRAILLAGE" | "ATTACHEMENT" | "QUANTITE" | "AVANCES" | "FINALE";

const TABS: { key: TabKey; label: string }[] = [
  { key: "TOTAL_FERRAILLAGE", label: "Calcule Totale De Ferraillage" },
  { key: "ATTACHEMENT", label: "Rapport d'attachement" },
  { key: "QUANTITE", label: "Calcule de Quantité" },
  { key: "AVANCES", label: "Avances de paiment" },
  { key: "FINALE", label: "Verification et calcule Finale" },
];

export default function FerRapportViewPage() {
  const { rapportId } = useParams();
  const nav = useNavigate();

  const [rapport, setRapport] = useState<FerRapportDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>("TOTAL_FERRAILLAGE");

  useEffect(() => {
    if (!rapportId) return;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setErr(null);
    });

    ferraillageApi
      .getRapport(rapportId)
      .then((r) => {
        if (cancelled) return;
        setRapport(r.item);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(isFerApiError(e) ? e.message : "Failed to load rapport");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rapportId]);

  const tabLabel = useMemo(() => TABS.find((t) => t.key === tab)?.label ?? "", [tab]);

  const lastEtatDate = useMemo(() => maxIso((rapport?.etats ?? []).map((e) => e.etatDate)), [rapport]);
  const lastRestantDate = useMemo(() => maxIso((rapport?.restants ?? []).map((r) => r.rapportDate)), [rapport]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6 w-[80%] mx-auto">
        <p className="text-red-600">Error: {err}</p>
        <button onClick={() => nav(-1)} className="mt-4 px-4 py-2 bg-(--primary) text-white rounded" type="button">
          Retour
        </button>
      </div>
    );
  }

  if (!rapport) {
    return (
      <div className="p-6 w-[80%] mx-auto">
        <p className="text-gray-700">Rapport introuvable.</p>
        <button onClick={() => nav(-1)} className="mt-4 px-4 py-2 bg-(--primary) text-white rounded" type="button">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex items-center gap-4">
        <button onClick={() => nav(-1)} className="px-4 py-2 bg-(--primary) text-white rounded" type="button">
          Back to list
        </button>
        <h1 className="text-3xl font-bold">Ferraillage — Détails du rapport</h1>
      </div>

      <div className="bg-white shadow rounded p-6 grid grid-cols-2 gap-6">
        <div>
          <strong>Chantier:</strong> {rapport.chantierName ?? "—"}
        </div>
        <div>
          <strong>Sous-traitant:</strong> {rapport.sousTraitant ?? "—"}
        </div>

        <div>
          <strong>Etats chantier:</strong> {rapport.etats.length} (Dernier: {fmtDateTime(lastEtatDate)})
        </div>
        <div>
          <strong>Restants:</strong> {rapport.restants.length} (Dernier: {fmtDateTime(lastRestantDate)})
        </div>

        <div>
          <strong>Created At:</strong> {fmtDateTime(rapport.createdAt)}
        </div>
        <div>
          <strong>Updated At:</strong> {fmtDateTime(rapport.updatedAt)}
        </div>
      </div>

      <div className="">
        <div className="flex flex-wrap gap-2 border-b-transparent p-3">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={
                  active
                    ? "px-4 py-2 rounded bg-(--primary) text-white font-semibold"
                    : "px-4 py-2 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }
                type="button"
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 min-h-65">
          {tab === "TOTAL_FERRAILLAGE" ? (
            <CalculeTotalFerraillage />
          ) : tab === "ATTACHEMENT" ? (
            <RapportAttachementTab rapportId={rapport.id} />
          ) : (
            <div className="text-gray-500">
              <strong>{tabLabel}</strong>
              <div className="mt-2 italic">Contenu à définir…</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
