import TotalRowModalWindowInner from "./totalRowModal/TotalRowModalWindowInner";
export type {
  RowForme,
  ExtraBoxKind,
  ExtraBoxPayload,
  ExtraFormePayload,
  TotalRowModalPayload,
} from "./totalRowModal/types";

export default function TotalRowModalWindow(props: {
  open: boolean;
  title: string;
  submitLabel: string;
  inputClass: string;
  mms: number[];
  initial?: Partial<import("./totalRowModal/types").TotalRowModalPayload>;
  onClose: () => void;
  onSubmit: (payload: import("./totalRowModal/types").TotalRowModalPayload) => void;
}) {
  if (!props.open) return null;
  return <TotalRowModalWindowInner {...props} />;
}
