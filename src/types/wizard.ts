export type AcierType = "F400" | "F500";

export type WizardData = {
  chantierName: string;
  responsable: string;
  acierType: AcierType;
  selectedMms: number[];
};
