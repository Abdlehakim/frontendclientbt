import {
  getTypeDeNappeOptions,
  normalizeTypeDeNappe,
  type SlabNappe,
} from "../../config/formeBarreOptions";
import { getNappeLabel } from "../../config/formeBarreLabels";
import SelectDropdown from "../common/SelectDropdown";

export default function SlabNappeSelect({
  designation,
  value,
  onChange,
}: {
  designation: string;
  value: SlabNappe;
  onChange: (value: SlabNappe) => void;
}) {
  const options = getTypeDeNappeOptions(designation);
  const safeValue = normalizeTypeDeNappe(value, designation);

  return (
    <SelectDropdown
      label="Type de nappe"
      value={safeValue}
      onChange={onChange}
      options={options}
      getOptionLabel={getNappeLabel}
    />
  );
}
