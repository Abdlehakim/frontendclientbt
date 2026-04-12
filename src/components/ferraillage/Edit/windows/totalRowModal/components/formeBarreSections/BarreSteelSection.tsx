import type { BarreCategorie } from "../../config/formeBarreOptions";
import { BARRE_CATEGORIES } from "../../config/formeBarreOptions";
import SelectDropdown from "../common/SelectDropdown";

export default function BarreSteelSection({
  showLitField,
  barreCategorieValue,
  litValue,
  inputClass,
  onChange,
}: {
  showLitField: boolean;
  barreCategorieValue: BarreCategorie | "";
  litValue: string;
  inputClass: string;
  onChange: (value: BarreCategorie) => void;
}) {
  if (showLitField) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
        <SelectDropdown
          label="Type d’acier"
          value={barreCategorieValue}
          onChange={onChange}
          options={BARRE_CATEGORIES}
        />

        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold text-gray-700">Lit</label>
          <input
            className={[inputClass, "font-semibold"].join(" ")}
            value={litValue}
            readOnly
            aria-readonly="true"
            style={{ backgroundColor: "#EFF6FF", borderColor: "#3B82F6", color: "#1E40AF" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:col-span-2">
      <SelectDropdown
        label="Type d’acier"
        value={barreCategorieValue}
        onChange={onChange}
        options={BARRE_CATEGORIES}
      />
    </div>
  );
}