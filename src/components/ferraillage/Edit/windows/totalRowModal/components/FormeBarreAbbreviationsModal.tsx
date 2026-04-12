import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { CiCircleRemove } from "react-icons/ci";
import schemaImage from "@/assets/Shema1-image.png";

type AbbreviationItem = {
  label: string;
  meaning: string;
};

type AbbreviationSection = {
  title: string;
  items: AbbreviationItem[];
};

const SECTIONS: AbbreviationSection[] = [
  {
    title: "Abréviations",
    items: [
      { label: "Di.", meaning: "Diamètre" },
      { label: "L.", meaning: "Longueur" },
      { label: "N.", meaning: "Nombre" },
      { label: "N.T.", meaning: "Nombre total" },
      { label: "Q.", meaning: "Quantité" },
      { label: "Re.", meaning: "Relation" },
    ],
  },
];

export default function FormeBarreAbbreviationsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const closeOnBackdrop = (ev: ReactMouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(ev.target as Node)) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-240">
      <div className="absolute inset-0 bg-black/45" onMouseDown={closeOnBackdrop} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          className="w-full max-w-[86%] max-h-[88vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 flex flex-col"
        >
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">Abréviations</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Signification des abréviations utilisées dans le formulaire.
              </div>
            </div>

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

          <div className="p-5 overflow-y-auto">
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* Left: fixed width */}
              <div className="w-full lg:w-80 lg:min-w-80 lg:max-w-80 space-y-5">
                {SECTIONS.map((section) => (
                  <section
                    key={section.title}
                    className="rounded-lg border border-slate-200 bg-slate-50/60"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-900">
                      {section.title}
                    </div>

                    <div className="divide-y divide-slate-200">
                      {section.items.map((item) => (
                        <div
                          key={`${section.title}-${item.label}`}
                          className="grid grid-cols-[110px_1fr] gap-2 px-4 py-3"
                        >
                          <div className="text-sm font-semibold text-emerald-700">{item.label}</div>
                          <div className="text-sm text-slate-700">{item.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              {/* Right: take remaining width */}
              <div className="flex-1 min-w-0 w-full">
                <aside className="rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-900">
                    Schéma explicative de prendre mesure :
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="w-full h-90 rounded-md border border-dashed border-slate-300 bg-white overflow-hidden">
                      <img
                        src={schemaImage}
                        alt="Schéma explicative de prendre mesure"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>

                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700 leading-6">
                      <span className="font-semibold text-slate-900">Note :</span> Si un ancrage existe
                      des deux côtés de la barre (à gauche et à droite) dans le cas étudié, alors{" "}
                      <span className="font-semibold">Ancrage (m)</span> correspond à la{" "}
                      <span className="font-semibold">somme</span> des deux ancrages :
                      <div className="mt-1 font-semibold text-slate-900">
                        Ancrage (m) = Ancrage gauche (m) + Ancrage droite (m)
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>

          <div className="rounded-b-xl bg-gray-50 border-t border-slate-900/10 px-3.5 pt-2.5 pb-3.5 flex items-center justify-end">
            <button type="button" className="stepper__nav" onClick={onClose}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}