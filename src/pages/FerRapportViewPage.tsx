import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSpinner } from "react-icons/fa6";
import ProjectDetailViewContent from "@/components/ferraillage/ProjectDetailViewContent";
import {
  ferraillageApi,
  type FerraillageReportDetailDTO,
  isApiError as isFerApiError,
} from "@/lib/ferraillageApi";

export default function FerRapportViewPage() {
  const { rapportId } = useParams();
  const nav = useNavigate();

  const [report, setReport] =
    useState<FerraillageReportDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
      .then((response) => {
        if (cancelled) return;
        setReport(response.item);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErr(
          isFerApiError(error)
            ? error.message
            : "Failed to load Ferraillage report",
        );
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rapportId]);

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

  if (!report) {
    return (
      <div className="p-6 w-[80%] mx-auto">
        <p className="text-gray-700">
          Donnée de Ferraillage introuvable.
        </p>
        <button onClick={() => nav(-1)} className="mt-4 px-4 py-2 bg-(--primary) text-white rounded" type="button">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="project-print-area print-wrapper mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex items-center gap-4">
        <button onClick={() => nav(-1)} className="no-print px-4 py-2 bg-(--primary) text-white rounded" type="button">
          Back to list
        </button>
        <h1 className="text-3xl font-bold">
          Ferraillage - {report.name}
        </h1>
      </div>

      <ProjectDetailViewContent project={report.project} />
    </div>
  );
}
