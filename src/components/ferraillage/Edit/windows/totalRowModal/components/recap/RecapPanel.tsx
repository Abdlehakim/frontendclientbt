import { useMemo } from "react";
import { CiCircleRemove } from "react-icons/ci";
import { getSlabAxisLabels, isVoileDesignation } from "../../config/formeBarreLabels";
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
  splitQtyInPair?: boolean;
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

const defaultSlabPairALabels = [
  getSlabAxisLabels().ntParallelALabel,
  getSlabAxisLabels("voile").ntParallelALabel,
];
const defaultSlabPairBLabels = [
  getSlabAxisLabels().ntParallelBLabel,
  getSlabAxisLabels("voile").ntParallelBLabel,
];

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "0";
  return safeNumber(n).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function ferLabel(mm: number) {
  return `Fer de ${mm}`;
}

function quantiteFerLabel(mm: number | null) {
  return mm != null ? `Quantités Fer ${mm} (m)` : "Quantités (m)";
}

function formatDallePleineNtLabel(line: RecapLine, fallbackLabel: string) {
  const baseLabel = line.label || fallbackLabel;
  return line.dia != null ? `${baseLabel} Fer ${line.dia}` : baseLabel;
}

function getRecapBaseKey(key: string) {
  const idx = key.lastIndexOf(":");
  return idx >= 0 ? key.slice(0, idx) : key;
}

function isSemellePairALabel(label: string) {
  return label === "N.T.B façonnées (a)";
}

function isSemellePairBLabel(label: string) {
  return label === "N.T.B façonnées (b)";
}

function isDallePleinePairALabel(label: string) {
  return defaultSlabPairALabels.some((prefix) => label === prefix || label.startsWith(`${prefix} `));
}

function isDallePleinePairBLabel(label: string) {
  return defaultSlabPairBLabels.some((prefix) => label === prefix || label.startsWith(`${prefix} `));
}

function isExplicitDallePleinePair(left: RecapLine, right: RecapLine) {
  return (
    left.splitQtyInPair === true &&
    right.splitQtyInPair === true &&
    getRecapBaseKey(left.key) === getRecapBaseKey(right.key)
  );
}

function groupBarreLines(lines: RecapLine[]): GroupedBarreEntry[] {
  const out: GroupedBarreEntry[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i];
    const next = lines[i + 1];

    if (
      current &&
      next &&
      (
        (
          isSemellePairALabel(current.label) &&
          isSemellePairBLabel(next.label)
        ) ||
        isExplicitDallePleinePair(current, next) ||
        (
          isDallePleinePairALabel(current.label) &&
          isDallePleinePairBLabel(next.label)
        )
      ) &&
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

function getExtraInstanceBaseName(label: string) {
  return label.includes("Épingle") ? "Épingle" : "Étriers";
}

function BarreSingleCard({
  title,
  l,
  isDallePleineDesignation = false,
  isVoileRecap = false,
  ntFallbackLabel = "N.T.B façonnées",
  cutLengthLabel = "Longueur tige à couper",
}: {
  title: string;
  l: RecapLine;
  isDallePleineDesignation?: boolean;
  isVoileRecap?: boolean;
  ntFallbackLabel?: string;
  cutLengthLabel?: string;
}) {
  const steelTypeLabel = isDallePleineDesignation ? "Type de nappe" : "Type d'acier";
  const litLabel = isDallePleineDesignation || isVoileRecap ? "Méthode de calcul" : "Lit";
  const ntLabel =
    isVoileRecap && l.label === "N.T.B façonnées"
      ? ntFallbackLabel
      : l.label || ntFallbackLabel;

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "-"}</div>
      </div>

      {l.steelType || l.litLabel ? (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {l.steelType ? (
            <>
              <div className="text-gray-500">{steelTypeLabel}</div>
              <div className="text-right font-semibold text-gray-900">{l.steelType}</div>
            </>
          ) : null}

          {l.litLabel ? (
            <>
              <div className="text-gray-500">{litLabel}</div>
              <div className="text-right font-semibold text-gray-900">{l.litLabel}</div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-500">Quantités</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>

        <div className="text-gray-500">{ntLabel}</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>

        <div className="text-gray-500">{cutLengthLabel}</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
      </div>
    </div>
  );
}

function BarrePairColumn({
  title,
  line,
  isDallePleineDesignation = false,
}: {
  title: string;
  line: RecapLine;
  isDallePleineDesignation?: boolean;
}) {
  const cutLengthLabel = isDallePleineDesignation ? "Longueur tige à couper" : "L. à couper";

  return (
    <>
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="shrink-0 text-gray-600">{line.dia != null ? ferLabel(line.dia) : "-"}</div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <div className="text-gray-500">Quantités</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(line.qtyM)} m</div>

        <div className="text-gray-500">{line.label || "N.T.B façonnées"}</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(line.nt)}</div>

        <div className="text-gray-500">{cutLengthLabel}</div>
        <div className="text-right font-semibold text-gray-900">{fmtNum(line.cutLenM)} m</div>
      </div>
    </>
  );
}

function BarrePairCard({
  title,
  left,
  right,
  isDallePleineDesignation = false,
  isVoileRecap = false,
  slabAxisLabels = getSlabAxisLabels(),
  pairTitleA = "(a)",
  pairTitleB = "(b)",
}: {
  title: string;
  left: RecapLine;
  right: RecapLine;
  isDallePleineDesignation?: boolean;
  isVoileRecap?: boolean;
  slabAxisLabels?: ReturnType<typeof getSlabAxisLabels>;
  pairTitleA?: string;
  pairTitleB?: string;
}) {
  const steelTypeLabel = isDallePleineDesignation ? "Type de nappe" : "Type d'acier";
  const litLabel = isDallePleineDesignation || isVoileRecap ? "Méthode de calcul" : "Lit";
  const totalQtyM = left.qtyM + right.qtyM;
  const showSplitQtyForDallePleine =
    isDallePleineDesignation &&
    left.splitQtyInPair === true &&
    right.splitQtyInPair === true;
  const showPerDiameterQuantities =
    isVoileRecap
      ? showSplitQtyForDallePleine &&
        left.dia != null &&
        right.dia != null &&
        left.dia !== right.dia
      : showSplitQtyForDallePleine;

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
      <div className="mb-2 text-xs font-semibold text-gray-900">{title}</div>

      {left.steelType || left.litLabel ? (
        <div className="mb-2 grid grid-cols-2 gap-2 text-xs">
          {left.steelType ? (
            <>
              <div className="text-gray-500">{steelTypeLabel}</div>
              <div className="text-right font-semibold text-gray-900">{left.steelType}</div>
            </>
          ) : null}

          {left.litLabel ? (
            <>
              <div className="text-gray-500">{litLabel}</div>
              <div className="text-right font-semibold text-gray-900">{left.litLabel}</div>
            </>
          ) : null}
        </div>
      ) : null}

      {isDallePleineDesignation ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {showPerDiameterQuantities ? (
            <>
              <div className="text-gray-500">{quantiteFerLabel(left.dia)}</div>
              <div className="text-right font-semibold text-gray-900">{fmtNum(left.qtyM)} m</div>

              <div className="text-gray-500">{quantiteFerLabel(right.dia)}</div>
              <div className="text-right font-semibold text-gray-900">{fmtNum(right.qtyM)} m</div>
            </>
          ) : (
            <>
              <div className="text-gray-500">Quantités</div>
              <div className="text-right font-semibold text-gray-900">{fmtNum(totalQtyM)} m</div>
            </>
          )}

          <div className="text-gray-500">
            {formatDallePleineNtLabel(left, slabAxisLabels.ntParallelALabel)}
          </div>
          <div className="text-right font-semibold text-gray-900">{fmtNum(left.nt)}</div>

          <div className="text-gray-500">
            {formatDallePleineNtLabel(right, slabAxisLabels.ntParallelBLabel)}
          </div>
          <div className="text-right font-semibold text-gray-900">{fmtNum(right.nt)}</div>

          <div className="text-gray-500">{slabAxisLabels.cutLengthALabel}</div>
          <div className="text-right font-semibold text-gray-900">{fmtNum(left.cutLenM)} m</div>

          <div className="text-gray-500">{slabAxisLabels.cutLengthBLabel}</div>
          <div className="text-right font-semibold text-gray-900">{fmtNum(right.cutLenM)} m</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <BarrePairColumn title={pairTitleA} line={left} isDallePleineDesignation={isDallePleineDesignation} />
          <BarrePairColumn title={pairTitleB} line={right} isDallePleineDesignation={isDallePleineDesignation} />
        </div>
      )}
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
  const normalizedDesignation = useMemo(() => designationLabel.toLowerCase(), [designationLabel]);
  const isVoileRecap = useMemo(() => isVoileDesignation(normalizedDesignation), [normalizedDesignation]);
  const isSemellesDesignation = normalizedDesignation === "semelles";
  const slabRecapDesignations = ["dalle pleine", "chape", "radier"];
  const isDallePleineDesignation =
    slabRecapDesignations.includes(normalizedDesignation) ||
    normalizedDesignation === "semelles" ||
    isVoileRecap;
  const slabAxisLabels = useMemo(() => getSlabAxisLabels(normalizedDesignation), [normalizedDesignation]);

  const usesLongueurLabel = useMemo(() => {
    const v = normalizedDesignation;
    return [
      "longrines",
      "raidisseurs",
      "linteaux",
      "chaînages",
      "poutres",
      "nervures",
      "semelles",
    ].includes(v);
  }, [normalizedDesignation]);

  const groupedBarreLines = useMemo(() => {
    return groupBarreLines(recap.linesBarres);
  }, [recap.linesBarres]);

  const titledExtraLines = useMemo(() => {
    const counts = { epingle: 0, etriers: 0 };

    return recap.linesExtras.map((line) => {
      const baseName = getExtraInstanceBaseName(line.label);
      const index =
        baseName === "Épingle"
          ? ++counts.epingle
          : ++counts.etriers;

      return {
        line,
        title: `${baseName} ${index}`,
      };
    });
  }, [recap.linesExtras]);

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

          {!isSemellesDesignation && !isDallePleineDesignation ? (
            <>
              <div className="text-gray-500">{hauteurLabel}</div>
              <div className="text-right font-semibold text-gray-900">
                {fmtNum(parsePositiveNumber(hauteurStr) ?? null)} m
              </div>
            </>
          ) : null}
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
              const title = `Barre ${index + 1}`;

              if (entry.type === "pair") {
                return (
                  <BarrePairCard
                    key={`${entry.left.key}__${entry.right.key}__${index}`}
                    title={title}
                    left={entry.left}
                    right={entry.right}
                    isDallePleineDesignation={isDallePleineDesignation}
                    isVoileRecap={isVoileRecap}
                    slabAxisLabels={slabAxisLabels}
                    pairTitleA={slabAxisLabels.pairTitleA}
                    pairTitleB={slabAxisLabels.pairTitleB}
                  />
                );
              }

              return (
                <BarreSingleCard
                  key={`${entry.line.key}__${index}`}
                  title={title}
                  l={entry.line}
                  isDallePleineDesignation={isDallePleineDesignation}
                  isVoileRecap={isVoileRecap}
                  ntFallbackLabel={isVoileRecap ? slabAxisLabels.ntParallelSharedLabel : "N.T.B façonnées"}
                  cutLengthLabel={isVoileRecap ? slabAxisLabels.cutLengthSharedLabel : "Longueur tige à couper"}
                />
              );
            })}

            {recap.linesCadres.map((l, index) => (
              <div key={l.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">{`Cadre ${index + 1}`}</div>
                  <div className="text-gray-600">{l.dia != null ? ferLabel(l.dia) : "-"}</div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.qtyM)} m</div>

                  <div className="text-gray-500">{l.label}</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.nt)}</div>

                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(l.cutLenM)} m</div>
                </div>
              </div>
            ))}

            {titledExtraLines.map(({ line, title }) => (
              <div key={line.key} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-gray-900">{title}</div>
                  <div className="text-gray-600">{line.dia != null ? ferLabel(line.dia) : "-"}</div>
                </div>

                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-gray-500">Quantités</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(line.qtyM)} m</div>

                  <div className="text-gray-500">{line.label}</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(line.nt)}</div>

                  <div className="text-gray-500">Longueur tige à couper</div>
                  <div className="text-right font-semibold text-gray-900">{fmtNum(line.cutLenM)} m</div>
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
