import { useMemo } from "react";
import { CiCircleRemove } from "react-icons/ci";
import { parsePositiveInt, parsePositiveNumber, safeNumber } from "../../utils";

export type RecapLine = {
  key: string;
  label: string;
  dia: number | null;
  qtyM: number;
  nt: number;
  cutLenM: number;
  steelType?: string;
  litLabel?: string;
};

export type RecapData = {
  totals: { dia: number; qtyM: number }[];
  linesCadres: RecapLine[];
  linesBarres: RecapLine[];
  linesExtras: RecapLine[];
};

type GroupedBarreEntry =
  | { type: "single"; line: RecapLine }
  | { type: "pair"; left: RecapLine; right: RecapLine };

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "0";
  return safeNumber(n).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function ferLabel(mm: number) {
  return `Fer de ${mm}`;
}

function getRecapBaseKey(key: string) {
  const idx = key.lastIndexOf(":");
  return idx >= 0 ? key.slice(0, idx) : key;
}

function isSemellePairALabel(label: string) {
  return label === "N.T.Barres façonnées (a)";
}

function isSemellePairBLabel(label: string) {
  return label === "N.T.Barres façonnées (b)";
}

function groupBarreLines(lines: RecapLine[]): GroupedBarreEntry[] {
  const out: GroupedBarreEntry[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i];
    const next = lines[i + 1];

    if (
      current &&
      next &&
      isSemellePairALabel(current.label) &&
      isSemellePairBLabel(next.label) &&
      getRecapBaseKey(current.key) === getRecapBaseKey(next.key)
    ) {
      out.push({
        type: "pair",
        left: current,
        right: next,
      });
      i += 1;
      continue;
    }

    out.push({
      type: "single",
      line: current,
    });
  }

  return out;
}

function BarreSingleCard({ l }: { l: RecapLine }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="font-semibold text-gray-900">
          {l.label || "N.T.Barres façonnées"}
        </div>
        <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "-"}</div>
      </div>

      {l.steelType || l.litLabel ? (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {l.steelType ? (
            <>
              <div className="text-gray-500">Type d'acier</div>
              <div className="text-right font-semibold text-gray-900">{l.steelType}</div>
            </>
          ) : null}

          {l.litLabel ? (
            <>
              <div className="text-gray-500">Lit</div>
              <div className="text-right font-semibold text-gray-900">{l.litLabel}</div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-500">Quantités</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>

        <div className="text-gray-500">N.T.</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>

        <div className="text-gray-500">Longueur tige à couper</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
      </div>
    </div>
  );
}

function BarrePairColumn({
  title,
  line,
}: {
  title: string;
  line: RecapLine;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="shrink-0 text-gray-600">{line.dia != null ? ferLabel(line.dia) : "-"}</div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <div className="text-gray-500">Quantités</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(line.qtyM)} m</div>

        <div className="text-gray-500">N.T.</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(line.nt)}</div>

        <div className="text-gray-500">L. à couper</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(line.cutLenM)} m</div>
      </div>
    </>
  );
}

function BarrePairCard({
  left,
  right,
}: {
  left: RecapLine;
  right: RecapLine;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="mb-2 text-xs font-semibold text-gray-900">
        N.T.Barres façonnées
      </div>

      <div className="grid grid-cols-1 gap-2">
        <BarrePairColumn title="(a)" line={left} />
        <BarrePairColumn title="(b)" line={right} />
      </div>
    </div>
  );
}

export default function RecapPanel({
  designation,
  typeName,
  nbStr,
  hauteurStr,
  recap,
  className = "",
  onClose,
}: {
  designation: string;
  typeName: string;
  nbStr: string;
  hauteurStr: string;
  recap: RecapData;
  className?: string;
  onClose?: () => void;
}) {
  const designationLabel = useMemo(() => (designation ?? "").trim(), [designation]);

  const usesLongueurLabel = useMemo(() => {
    const v = designationLabel.toLowerCase();
    return [
      "longrines",
      "raidisseurs",
      "linteaux",
      "chaînages",
      "poutres",
      "nervures",
      "semelles",
    ].includes(v);
  }, [designationLabel]);

  const groupedBarreLines = useMemo(() => {
    return groupBarreLines(recap.linesBarres);
  }, [recap.linesBarres]);

  const hauteurLabel = usesLongueurLabel ? "Longueur" : "Hauteur";
  const headTitle = designationLabel || "-";
  const subTitle = (typeName ?? "").trim();

  return (
    <div
      className={[
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl",
        className,
      ].join(" ").trim()}
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Récapitulatif</div>
          <div className="mt-0.5 text-xs text-gray-600">
            {headTitle} {(subTitle && `• ${subTitle}`) || ""}
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le récapitulatif"
            title="Fermer le récapitulatif"
            className="shrink-0 p-1 text-gray-700 transition-transform hover:scale-120 hover:cursor-pointer hover:text-red-600"
          >
            <CiCircleRemove size={24} />
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-gray-500">NB</div>
          <div className="text-right font-semibold text-gray-900">
            {fmtNum(parsePositiveInt(nbStr) ?? null, 0)}
          </div>

          <div className="text-gray-500">{hauteurLabel}</div>
          <div className="text-right font-semibold text-gray-900">
            {fmtNum(parsePositiveNumber(hauteurStr) ?? null)} m
          </div>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="mb-2 text-xs font-semibold text-gray-800">Totaux par diamètre</div>

          {recap.totals.length ? (
            <div className="space-y-2">
              {recap.totals.map((t) => (
                <div
                  key={t.dia}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-xs"
                >
                  <div className="font-semibold text-gray-900">{ferLabel(t.dia)}</div>
                  <div className="text-gray-700">
                    <span className="font-semibold">{fmtNum(t.qtyM)}</span>{" "}
                    <span className="text-gray-500">m</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">Ajoutez des éléments pour voir les totaux.</div>
          )}
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="mb-2 text-xs font-semibold text-gray-800">Détails rapides</div>

          <div className="space-y-2">
            {groupedBarreLines.map((entry, index) => {
              if (entry.type === "pair") {
                return (
                  <BarrePairCard
                    key={`${entry.left.key}__${entry.right.key}__${index}`}
                    left={entry.left}
                    right={entry.right}
                  />
                );
              }

              return <BarreSingleCard key={`${entry.line.key}__${index}`} l={entry.line} />;
            })}

            {recap.linesCadres.map((l) => (
              <div key={l.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">{l.label}</div>
                  <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "-"}</div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>

                  <div className="text-gray-500">N.T.</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>

                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
                </div>
              </div>
            ))}

            {recap.linesExtras.map((l) => (
              <div key={l.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">{l.label}</div>
                  <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "-"}</div>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>

                  <div className="text-gray-500">N.T.</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>

                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
                </div>
              </div>
            ))}

            {!recap.linesCadres.length && !groupedBarreLines.length && !recap.linesExtras.length ? (
              <div className="text-xs text-gray-500">Aucun élément.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
