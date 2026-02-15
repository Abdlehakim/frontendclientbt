// src/pages/FerraillagePage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import TablePagination from "@/components/tablePagination";
import { ferraillageApi, type FerRapportDTO, isApiError as isFerApiError } from "@/lib/ferraillageApi";
import { APP_HREFS } from "@/routes/paths";
import CreateRapportWizard from "@/components/ferraillage/CreateRapportWizard";
import CreateProjetWizard from "@/components/ferraillage/CreateProjetWizard";
import EditRapportWizard from "@/components/ferraillage/EditProjectData";

const PAGE_SIZE = 12;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function FerraillagePage() {
  const nav = useNavigate();

  const [items, setItems] = useState<FerRapportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const debounceRef = useRef<number | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [projectWizardOpen, setProjectWizardOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<FerRapportDTO | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setErr("");
    });

    ferraillageApi
      .listRapports()
      .then((r) => {
        if (cancelled) return;
        setItems(r.items || []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(isFerApiError(e) ? e.message : "Failed to load");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => {
      const a = (r.chantierName || "").toLowerCase();
      const b = (r.sousTraitant || "").toLowerCase();
      return a.includes(q) || b.includes(q);
    });
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const displayed = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setCurrentPage(1), 150);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  function onView(id: string) {
    nav(APP_HREFS.ferraillageRapportView(id));
  }

  function onEdit(item: FerRapportDTO) {
    setEditItem(item);
    setEditOpen(true);
  }

  async function onDelete(id: string) {
    const ok = window.confirm("Supprimer ce rapport ?");
    if (!ok) return;

    setErr("");
    setLoading(true);
    try {
      await ferraillageApi.deleteRapport(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      setErr(isFerApiError(e) ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto px-4 py-4 flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Ferraillage</h1>

        <div className="flex items-center gap-2">
          <button className="btn-fit-white-outline" type="button" onClick={() => setProjectWizardOpen(true)}>
            Créer Projet
          </button>

          <button className="btn-fit-white-outline" type="button" onClick={() => setWizardOpen(true)}>
            Créer Rapport
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end gap-6 h-17.5">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche:</label>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Chantier / sous-traitant"
            className="border border-gray-300 rounded px-2 py-1 bg-white"
          />
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-(--primary) text-white">
            <tr>
              <th className="py-2 text-sm font-medium text-center">Chantier</th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">Sous-traitant</th>
              <th className="py-2 text-sm font-medium text-center">Créé le</th>
              <th className="py-2 text-sm font-medium text-center border-x-4 border-white">MàJ le</th>
              <th className="w-2/9 py-2 text-sm font-medium text-center">Actions</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucun rapport trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((r, i) => (
                  <tr key={r.id} className={i % 2 ? "bg-gray-100" : "bg-white"}>
                    <td className="py-2 text-center font-semibold truncate">{r.chantierName}</td>
                    <td className="py-2 text-center truncate">{r.sousTraitant ?? "—"}</td>
                    <td className="py-2 text-center">{fmtDate(r.createdAt)}</td>
                    <td className="py-2 text-center">{fmtDate(r.updatedAt)}</td>
                    <td className="py-2 w-2/9">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => onEdit(r)} className="ButtonSquare" title="Modifier" type="button">
                          <FaRegEdit size={14} />
                        </button>
                        <button onClick={() => onView(r.id)} className="ButtonSquare" title="Voir" type="button">
                          <FaRegEye size={14} />
                        </button>
                        <button onClick={() => void onDelete(r.id)} className="ButtonSquareDelete" title="Supprimer" type="button">
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <CreateRapportWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      <CreateProjetWizard open={projectWizardOpen} onClose={() => setProjectWizardOpen(false)} />

      <EditRapportWizard
        open={editOpen}
        rapport={editItem}
        onClose={() => {
          setEditOpen(false);
          setEditItem(null);
        }}
      />
    </div>
  );
}
