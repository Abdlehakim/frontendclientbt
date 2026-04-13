import { CiCircleRemove } from "react-icons/ci";

export default function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-3 bg-gray-50 rounded-t-xl border-b border-gray-200 flex items-center justify-between shrink-0">
      <div className="text-sm font-semibold text-gray-900">{title}</div>

      <div className="flex items-center gap-2">
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
    </div>
  );
}

