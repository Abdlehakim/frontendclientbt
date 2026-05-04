import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";
import ProjectDetailViewContent from "@/components/ferraillage/ProjectDetailViewContent";
import ProjectModalShell from "@/components/ferraillage/ProjectModalShell";
import { ferraillageApi, isApiError as isFerApiError, type FerProjectDetailDTO } from "@/lib/ferraillageApi";

type ViewProjectDataProps = {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName?: string | null;
};

function ViewProjectDataPanel({ onClose, projectId, projectName }: Omit<ViewProjectDataProps, "open">) {
  const [project, setProject] = useState<FerProjectDetailDTO | null>(null);
  const [loading, setLoading] = useState(Boolean(projectId));
  const [err, setErr] = useState("");
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      setErr("");
      return;
    }

    let cancelled = false;

    setLoading(true);
    setErr("");
    setProject(null);

    ferraillageApi
      .getProject(projectId)
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
  }, [projectId]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("project-print-active");
    };
  }, []);

  const handlePrint = () => {
    if (!printAreaRef.current) return;

    document.body.classList.add("project-print-active");
    const cleanup = () => document.body.classList.remove("project-print-active");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.requestAnimationFrame(() => window.print());
  };

  return (
    <ProjectModalShell
      title="Ferraillage - Details du projet"
      subtitle={project?.chantierName || projectName ? <span className="font-semibold">{project?.chantierName ?? projectName}</span> : "-"}
      onClose={onClose}
    >
      <div ref={printAreaRef} className="project-print-area print-wrapper">
        <div className="print-only mb-4 border-b border-gray-200 pb-3">
          <div className="text-xl font-bold text-slate-900">Ferraillage - Details du projet</div>
          <div className="mt-1 text-sm text-slate-600">{project?.chantierName ?? projectName ?? "-"}</div>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center no-print">
            <FaSpinner className="animate-spin text-4xl text-(--primary)" />
          </div>
        ) : err ? (
          <div className="rounded-lg bg-white p-6 text-red-600 shadow-sm project-print-card print-card">{err}</div>
        ) : project ? (
          <ProjectDetailViewContent project={project} onPrint={handlePrint} />
        ) : (
          <div className="rounded-lg bg-white p-6 text-gray-700 shadow-sm project-print-card print-card">Projet introuvable.</div>
        )}
      </div>
    </ProjectModalShell>
  );
}

export default function ViewProjectData({ open, onClose, projectId, projectName }: ViewProjectDataProps) {
  if (!open) return null;

  return createPortal(<ViewProjectDataPanel key={projectId ?? "none"} onClose={onClose} projectId={projectId} projectName={projectName} />, document.body);
}
