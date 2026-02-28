import { parsePositiveInt, parsePositiveNumber } from "../utils";

export type RecapLine = {
  key: string;
  label: string;
  dia: number | null;
  qtyM: number;
  nt: number;
  cutLenM: number;
};

export type RecapData = {
  totals: { dia: number; qtyM: number }[];
  linesCadres: RecapLine[];
  linesBarres: RecapLine[];
  linesExtras: RecapLine[];
};

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null) return "—";
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function ferLabel(mm: number) {
  return `Fer de ${mm}`;
}

export default function RecapPanel({
  designation,
  typeName,
  nbStr,
  hauteurStr,
  enrobageStr,
  recap,
}: {
  designation: string;
  typeName: string;
  nbStr: string;
  hauteurStr: string;
  enrobageStr: string;
  recap: RecapData;
}) {
  return (
    <div className="hidden lg:flex w-85 shrink-0 rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden flex-col">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-sm font-semibold text-gray-900">Récapitulatif</div>
        <div className="text-xs text-gray-600 mt-0.5">
          {(designation ?? "").trim() || "—"} {((typeName ?? "").trim() && `• ${typeName.trim()}`) || ""}
        </div>
      </div>

      <div className="p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-500">NB</div>
          <div className="font-semibold text-gray-900 text-right">{fmtNum(parsePositiveInt(nbStr) ?? null, 0)}</div>

          <div className="text-gray-500">Hauteur</div>
          <div className="font-semibold text-gray-900 text-right">{fmtNum(parsePositiveNumber(hauteurStr) ?? null)} m</div>

          <div className="text-gray-500">Enrobage</div>
          <div className="font-semibold text-gray-900 text-right">{fmtNum(parsePositiveNumber(enrobageStr) ?? null)} m</div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="text-xs font-semibold text-gray-800 mb-2">Totaux par diamètre</div>

          {recap.totals.length ? (
            <div className="space-y-2">
              {recap.totals.map((t) => (
                <div key={t.dia} className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-xs">
                  <div className="font-semibold text-gray-900">{ferLabel(t.dia)}</div>
                  <div className="text-gray-700">
                    <span className="font-semibold">{fmtNum(t.qtyM)}</span> <span className="text-gray-500">m</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Ajoutez des éléments pour voir les totaux.</div>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="text-xs font-semibold text-gray-800 mb-2">Détails rapides</div>

          <div className="space-y-2">
            {recap.linesCadres.map((l) => (
              <div key={l.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">{l.label}</div>
                  <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "—"}</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">N.T.</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>
                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
                </div>
              </div>
            ))}

            {recap.linesBarres.map((l) => (
              <div key={l.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">N.T.Barre</div>
                  <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "—"}</div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">N.T.</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>
                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
                </div>
              </div>
            ))}

            {recap.linesExtras.map((l) => (
              <div key={l.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">{l.label}</div>
                  <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "—"}</div>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">N.T.</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>
                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
                </div>
              </div>
            ))}

            {!recap.linesCadres.length && !recap.linesBarres.length && !recap.linesExtras.length ? (
              <div className="text-xs text-gray-500">Aucun élément.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
