import { useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import {
  attFerraillageApi,
  type FerDiametreDTO,
  type FerEtatChantierFullDTO,
  type FerRestantNonConfectionneFullDTO,
  isApiError as isFerApiError,
} from "@/lib/attFerraillageApi";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function fmtQtyFR(qty?: string | null) {
  if (!qty) return "";
  const n = Number(qty);
  if (!Number.isFinite(n)) return qty;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(n);
}

export default function RapportAttachementTab({ rapportId }: { rapportId: string }) {
  const [etat, setEtat] = useState<FerEtatChantierFullDTO | null>(null);
  const [restant, setRestant] = useState<FerRestantNonConfectionneFullDTO | null>(null);
  const [diametres, setDiametres] = useState<FerDiametreDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setErr("");
    });

    Promise.all([
      attFerraillageApi.listDiametres(),
      attFerraillageApi.getEtatByRapportId(rapportId),
      attFerraillageApi.getRestantByRapportId(rapportId),
    ])
      .then(([d, e, r]) => {
        if (cancelled) return;
        setDiametres(d.items ?? []);
        setEtat(e.item ?? null);
        setRestant(r.item ?? null);
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
  }, [rapportId]);

  const mouvements = useMemo(() => etat?.mouvements ?? [], [etat]);
  const snapshots = useMemo(() => restant?.snapshots ?? [], [restant]);

  const mmCols = useMemo(() => {
    const active = (diametres ?? []).filter((d) => d.isActive).sort((a, b) => a.mm - b.mm);
    if (active.length) return active.map((d) => d.mm);

    const set = new Set<number>();
    for (const m of mouvements) for (const l of m.lignes ?? []) set.add(l.diametre.mm);
    for (const s of snapshots) for (const l of s.lignes ?? []) set.add(l.diametre.mm);
    return Array.from(set).sort((a, b) => a - b);
  }, [diametres, mouvements, snapshots]);

  const etatRows = useMemo(() => {
    return mouvements.map((m) => {
      const qtyByMm = new Map<number, string>();
      for (const l of m.lignes ?? []) qtyByMm.set(l.diametre.mm, l.qty);
      return { m, qtyByMm };
    });
  }, [mouvements]);

  const restantRows = useMemo(() => {
    return snapshots.map((s) => {
      const qtyByMm = new Map<number, string>();
      for (const l of s.lignes ?? []) qtyByMm.set(l.diametre.mm, l.qty);
      return { s, qtyByMm };
    });
  }, [snapshots]);

  const totalsEtatByMm = useMemo(() => {
    const map = new Map<number, number>();
    for (const { qtyByMm } of etatRows) {
      for (const mm of mmCols) {
        const q = qtyByMm.get(mm);
        const n = Number(q);
        if (!Number.isFinite(n)) continue;
        map.set(mm, (map.get(mm) ?? 0) + n);
      }
    }
    return map;
  }, [etatRows, mmCols]);

  const totalsRestantByMm = useMemo(() => {
    const map = new Map<number, number>();
    for (const { qtyByMm } of restantRows) {
      for (const mm of mmCols) {
        const q = qtyByMm.get(mm);
        const n = Number(q);
        if (!Number.isFinite(n)) continue;
        map.set(mm, (map.get(mm) ?? 0) + n);
      }
    }
    return map;
  }, [restantRows, mmCols]);

  if (loading) {
    return (
      <div className="min-h-60 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl" />
      </div>
    );
  }

  if (err) return <div className="text-sm text-red-600">{err}</div>;

  if (!etat && !restant) {
    return (
      <div className="text-gray-600">
        Aucun <strong>Etat de chantier</strong> ni <strong>Restant non confectionné</strong> pour ce rapport.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {etat ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">
              ETAT DE FER LIVRE AU CHANTIER
            </div>
            <div className="text-sm text-gray-700">
              <strong>Etat Date:</strong> {fmtDate(etat.etatDate)}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="border-collapse table-fixed w-full min-w-262.5">
              <thead>
                <tr className="bg-(--primary) text-white">
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
                    Date
                  </th>
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-80">
                    N° Bon de livraison
                  </th>
                  {mmCols.map((mm) => (
                    <th
                      key={mm}
                      className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75"
                    >
                      Fer de {mm}
                    </th>
                  ))}
                </tr>
              </thead>

              {etatRows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={2 + mmCols.length} className="py-6 text-center text-gray-600">
                      Aucun mouvement.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {etatRows.map(({ m, qtyByMm }, idx) => {
                    const isTransfer = m.type === "TRANSFERT";
                    const rowBg = idx % 2 ? "bg-gray-200" : "bg-white";

                    return (
                      <tr key={m.id} className={rowBg}>
                        <td
                          className={[
                            "py-1 text-center text-sm border-r-2",
                            isTransfer ? "text-red-600 font-semibold" : "",
                          ].join(" ")}
                        >
                          {fmtDate(m.date)}
                        </td>

                        <td className="py-1 px-2 text-center text-xs border-r-2">
                          {m.bonLivraison ? <div className="font-semibold">{m.bonLivraison}</div> : null}

                          {m.note ? (
                            <div
                              className={
                                isTransfer
                                  ? "text-red-600 italic font-semibold text-[12px]"
                                  : "text-gray-600 italic font-semibold text-[12px]"
                              }
                            >
                              {m.note}
                            </div>
                          ) : null}

                          {!m.bonLivraison && !m.note ? "—" : null}
                        </td>

                        {mmCols.map((mm) => {
                          const q = qtyByMm.get(mm) ?? "";
                          const n = Number(q);
                          const neg = Number.isFinite(n) && n < 0;

                          return (
                            <td
                              key={mm}
                              className={[
                                "py-1 text-center text-xs border-r-2",
                                neg ? "text-red-600 font-semibold" : "",
                              ].join(" ")}
                            >
                              {q ? fmtQtyFR(q) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  <tr className="bg-(--primary) text-white">
                    <td className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">TOTAL</td>
                    <td className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40" />
                    {mmCols.map((mm) => {
                      const t = totalsEtatByMm.get(mm);
                      return (
                        <td
                          key={mm}
                          className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                        >
                          {t === undefined ? "" : fmtQtyFR(String(t))}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      ) : (
        <div className="text-gray-600">
          Aucun <strong>Etat de chantier</strong> pour ce rapport.
        </div>
      )}

      {restant ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wide text-gray-800">
              Quantité restante non confectionné
            </div>
            <div className="text-sm text-gray-700">
              <strong>Rapport Date:</strong> {fmtDate(restant.rapportDate)}
            </div>
          </div>

          <div className="overflow-auto">
            <table className="border-collapse table-fixed w-full min-w-262.5">
              <thead>
                <tr className="bg-(--primary) text-white">
                  <th className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">
                    Date
                  </th>
                  {mmCols.map((mm) => (
                    <th
                      key={mm}
                      className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-23.75"
                    >
                      Fer de {mm}
                    </th>
                  ))}
                </tr>
              </thead>

              {restantRows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={1 + mmCols.length} className="py-6 text-center text-gray-600">
                      Aucun snapshot.
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {restantRows.map(({ s, qtyByMm }, idx) => {
                    const rowBg = idx % 2 ? "bg-gray-200" : "bg-white";

                    return (
                      <tr key={s.id} className={rowBg}>
                        <td className="py-1 text-center text-sm border-r-2">
                          {fmtDate(s.date)}
                          {s.note ? <div className="text-[11px] italic text-gray-600">{s.note}</div> : null}
                        </td>

                        {mmCols.map((mm) => {
                          const q = qtyByMm.get(mm) ?? "";
                          return (
                            <td key={mm} className="py-1 text-center text-xs border-r-2">
                              {q ? fmtQtyFR(q) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  <tr className="bg-(--primary) text-white">
                    <td className="py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40">TOTAL</td>
                    {mmCols.map((mm) => {
                      const t = totalsRestantByMm.get(mm);
                      return (
                        <td
                          key={mm}
                          className="border-r-2 py-2 text-[11px] font-semibold text-center uppercase tracking-wide w-40"
                        >
                          {t === undefined ? "" : fmtQtyFR(String(t))}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      ) : (
        <div className="text-gray-600">
          Aucun <strong>Restant non confectionné</strong> pour ce rapport.
        </div>
      )}
    </div>
  );
}
