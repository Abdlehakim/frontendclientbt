import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { CiCircleRemove } from "react-icons/ci";

type ProjectModalShellProps = {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  panelClassName?: string;
  bodyClassName?: string;
};

export default function ProjectModalShell({
  title,
  subtitle,
  onClose,
  children,
  headerActions,
  footer,
  panelClassName,
  bodyClassName,
}: ProjectModalShellProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resolvedPanelClassName = `project-print-modal-panel modal-content ${
    panelClassName ?? "w-full max-w-[98%] h-[98%] rounded-xl bg-white shadow-xl border border-gray-200 flex flex-col"
  }`;
  const resolvedBodyClassName = `project-print-modal-body modal-body ${bodyClassName ?? "p-4 flex-1 overflow-auto bg-green-50"}`;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const closeOnBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose();
  };

  return (
    <div className="project-print-modal modal project-detail-modal fixed inset-0 z-99">
      <div className="project-print-backdrop absolute inset-0 bg-black/40 no-print" onMouseDown={closeOnBackdrop} />

      <div className="project-print-modal-viewport absolute inset-0 flex items-center justify-center p-4">
        <div ref={panelRef} className={resolvedPanelClassName}>
          <div className="project-print-modal-header no-print px-5 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-900">{title}</div>
              <div className="text-xs text-gray-600">{subtitle ?? "-"}</div>
            </div>

            <div className="flex items-center gap-3">
              {headerActions}

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                title="Fermer"
                className="close-button p-1 text-gray-700 hover:cursor-pointer hover:text-red-600 hover:scale-120 transition-transform no-print"
              >
                <CiCircleRemove size={28} />
              </button>
            </div>
          </div>

          <div className={resolvedBodyClassName}>{children}</div>

          <div
            className="
              project-print-modal-footer
              modal-footer
              no-print
              rounded-b-xl bg-gray-50
              border-t border-slate-900/10
              px-3.5 pt-2.5 pb-3.5
              flex items-center justify-between gap-3
            "
            aria-label="Actions"
          >
            {footer ?? (
              <>
                <div className="flex items-center justify-start gap-2 flex-1">
                  <button type="button" onClick={onClose} className="stepper__nav" id="modelCancelFlowBtn">
                    Fermer
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 flex-1 whitespace-nowrap" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
