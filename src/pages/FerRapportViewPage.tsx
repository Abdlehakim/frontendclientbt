import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSpinner } from "react-icons/fa6";
import ProjectDetailViewContent from "@/components/ferraillage/ProjectDetailViewContent";
import { ferraillageApi, type FerProjectDetailDTO, isApiError as isFerApiError } from "@/lib/ferraillageApi";

export default function FerRapportViewPage() {
  const { rapportId } = useParams();
  const nav = useNavigate();

  const [project, setProject] = useState<FerProjectDetailDTO | null>(null);
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
      .getProject(rapportId)
      .then((response) => {
        if (cancelled) return;
        setProject(response.item);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErr(isFerApiError(error) ? error.message : "Failed to load project");
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

  if (!project) {
    return (
      <div className="p-6 w-[80%] mx-auto">
        <p className="text-gray-700">Projet introuvable.</p>
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
        <h1 className="text-3xl font-bold">Ferraillage - Details du projet</h1>
      </div>

      <ProjectDetailViewContent project={project} />
    </div>
  );
}
