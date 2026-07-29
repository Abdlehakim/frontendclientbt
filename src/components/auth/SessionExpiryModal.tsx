import { createPortal } from "react-dom";
import { FaSpinner } from "react-icons/fa6";

type SessionExpiryModalProps = {
  open: boolean;
  remainingSeconds: number;
  loading: boolean;
  error: string;
  onContinue: () => void;
};

export default function SessionExpiryModal({
  open,
  remainingSeconds,
  loading,
  error,
  onContinue,
}: SessionExpiryModalProps) {
  if (!open) return null;

  const displayedSeconds = Math.max(
    0,
    remainingSeconds,
  );

  return createPortal(
    <div
      className="fixed inset-0 z-300"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
    >
      <div className="absolute inset-0 bg-black/45" />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
          <div className="border-b border-gray-200 px-5 py-5 sm:px-8">
            <h2
              id="session-expiry-title"
              className="text-[1.6rem] font-bold leading-none text-slate-900"
            >
              Session expirée
            </h2>
          </div>

          <div className="space-y-6 px-5 py-8 text-slate-600 sm:px-8">
            <p className="text-lg leading-relaxed">
              Votre session a expiré. Confirmez que vous
              souhaitez continuer à travailler.
            </p>

            <p className="text-center text-xl font-bold text-slate-900">
              Redirection vers la page de connexion dans{" "}
              <span className="text-3xl tabular-nums">
                {displayedSeconds}
              </span>{" "}
              secondes.
            </p>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end border-t border-gray-200 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={onContinue}
              disabled={
                loading || displayedSeconds === 0
              }
              className="btn-fit-white-outline inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Renouvellement...
                </>
              ) : (
                "Continuer à travailler"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
