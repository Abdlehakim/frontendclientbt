import DiametreDropdown from "./DiametreDropdown";

export default function DiametreField({
  label,
  mms,
  value,
  onChange,
}: {
  label: string;
  mms: number[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col">
      <DiametreDropdown label={label} mms={mms} value={value} onChange={onChange} />
    </div>
  );
}
