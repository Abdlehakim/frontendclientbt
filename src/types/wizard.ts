export type AcierType = "F400" | "F500";

export type WizardData = {
  chantierName: string;
  sousTraitant: string;
  acierType: AcierType;
  selectedMms: number[];
};
