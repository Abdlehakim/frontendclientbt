import {
  calculatePreviewAverage,
  calculatePreviewMaturity,
  formatCompressionNumber,
} from "@/components/compression/CompressionSamplesTable";
import type {
  CompressionProjectDTO,
  CompressionReportInput,
  CompressionResultInput,
} from "@/lib/compressionApi";

type CompressionReportPrintViewProps = {
  report: CompressionReportInput;
  project: CompressionProjectDTO | null;
  resultColumnCount: number;
};

function formatDate(value: string | null | undefined): string {
  const dateOnly = value?.slice(0, 10) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return "—";
  const [year, month, day] = dateOnly.split("-");
  return `${day}/${month}/${year}`;
}

function displayResult(
  result: CompressionResultInput | undefined,
): string {
  if (!result) return "—";
  if (result.status === "VALID") {
    return formatCompressionNumber(result.value);
  }
  return result.note?.trim() || "—";
}

export default function CompressionReportPrintView({
  report,
  project,
  resultColumnCount,
}: CompressionReportPrintViewProps) {
  const projectTitle =
    report.title?.trim() ||
    project?.chantierName.trim() ||
    "—";

  return (
    <div className="compression-print-root print-only">
      <div className="mb-3 grid grid-cols-[1fr_auto] gap-6">
        <div className="text-center">
          <div className="text-base font-bold uppercase">
            PROJET {projectTitle}
          </div>
          <div className="mt-1 text-sm font-bold uppercase">
            RÉCAP DES RÉSULTATS DES COMPTES RENDUS
          </div>
          <div className="text-sm font-bold uppercase">
            ESSAI À LA COMPRESSION
          </div>
        </div>

        <div className="text-right text-[10px] font-semibold uppercase">
          <div>DATE : {formatDate(report.reportDate)}</div>
          <div>
            CHANTIER : {project?.chantierName.trim() || "—"}
          </div>
        </div>
      </div>

      <table className="compression-print-table">
        <thead>
          <tr>
            <th rowSpan={2}>N°</th>
            <th rowSpan={2}>Dosage</th>
            <th rowSpan={2}>Ciment</th>
            <th rowSpan={2}>Adjuvant</th>
            <th rowSpan={2}>Désignation</th>
            <th rowSpan={2}>Date coulage / prélèvement</th>
            <th rowSpan={2}>Date d’envoi éprouvette</th>
            <th rowSpan={2}>Date d’écrasement</th>
            <th rowSpan={2}>Nbr éprouvettes</th>
            <th rowSpan={2}>Réf</th>
            <th rowSpan={2}>Maturité jours</th>
            <th colSpan={resultColumnCount}>Résultat</th>
            <th rowSpan={2}>Moyenne</th>
          </tr>
          <tr>
            {Array.from(
              { length: resultColumnCount },
              (_, index) => (
                <th key={`print-ep-${index + 1}`}>
                  EP{index + 1}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody>
          {report.samples.map((sample, sampleIndex) =>
            sample.series.map((series, seriesIndex) => {
              const maturity = calculatePreviewMaturity(
                sample.pourDate,
                series.crushingDate,
              );
              const average = calculatePreviewAverage(
                series.results,
              );
              const resultsByNumber = new Map(
                series.results.map((result) => [
                  result.specimenNumber,
                  result,
                ]),
              );

              return (
                <tr key={`${sampleIndex}-${seriesIndex}`}>
                  {seriesIndex === 0 ? (
                    <>
                      <td rowSpan={sample.series.length}>
                        {sample.sequenceNumber}
                      </td>
                      <td rowSpan={sample.series.length}>
                        {sample.dosage || "—"}
                      </td>
                      <td rowSpan={sample.series.length}>
                        {sample.cement || "—"}
                      </td>
                      <td rowSpan={sample.series.length}>
                        {sample.admixture?.trim() || "—"}
                      </td>
                      <td rowSpan={sample.series.length}>
                        {sample.designation || "—"}
                      </td>
                      <td rowSpan={sample.series.length}>
                        {formatDate(sample.pourDate)}
                      </td>
                      <td rowSpan={sample.series.length}>
                        {formatDate(sample.specimenSendDate)}
                      </td>
                    </>
                  ) : null}

                  <td>{formatDate(series.crushingDate)}</td>

                  {seriesIndex === 0 ? (
                    <td rowSpan={sample.series.length}>
                      {sample.specimenCount}
                    </td>
                  ) : null}

                  <td>{series.reference?.trim() || "—"}</td>
                  <td>
                    {maturity === null ? "—" : `${maturity} JRS`}
                  </td>

                  {Array.from(
                    { length: resultColumnCount },
                    (_, index) => (
                      <td
                        key={`${sampleIndex}-${seriesIndex}-ep-${index + 1}`}
                      >
                        {displayResult(
                          resultsByNumber.get(index + 1),
                        )}
                      </td>
                    ),
                  )}

                  <td>{formatCompressionNumber(average)}</td>
                </tr>
              );
            }),
          )}
        </tbody>
      </table>

      {report.companyName?.trim() ? (
        <div className="mt-3 text-right text-[10px] font-bold uppercase">
          {report.companyName.trim()}
        </div>
      ) : null}
    </div>
  );
}
