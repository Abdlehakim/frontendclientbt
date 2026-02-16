export type PortalPos =
  | null
  | {
      left: number;
      width: number;
      top?: number;
      bottom?: number;
      maxHeight: number;
    };

export type RowForme = "BARRE" | "CARRE" | "CIRCULAIRE" | "RECTANGULAIRE";

export type ExtraFormePayload = {
  forme: RowForme;
  diametreMm: number;
  nBarre: number | null;
  longueur: number | null;
  largeur: number | null;
  rayon: number | null;
  ancrage: number | null;
  perimetre: number | null;
  espacement: number | null;
  attenteBarre?: number | null;
};

export type ExtraBoxKind = "EPINGLE" | "ETRIERS";

export type ExtraBoxPayload = {
  kind: ExtraBoxKind;
  diametreMm: number;
  n: number | null;
  longueur: number | null;
  ancrage: number | null;
  perimetre: number | null;
  espacement: number | null;
};

export type TotalRowModalPayload = {
  designation: string;
  typeName: string;
  nb: number | null;
  hauteur: number | null;
  enrobage: number | null;

  forme: RowForme;
  diametreMm: number;
  nBarre: number | null;
  longueur: number | null;
  largeur: number | null;
  rayon: number | null;

  ancrage: number | null;
  attenteBarre?: number | null;

  perimetre: number | null;
  espacement: number | null;

  epingle: number | null;
  etriers: number | null;

  extraFormes?: ExtraFormePayload[];
  extraBoxes?: ExtraBoxPayload[];
};

export type FormeState = {
  id: string;
  forme: RowForme;
  diametreMm: number;
  nBarreStr: string;
  longueurStr: string;
  largeurStr: string;
  rayonStr: string;
  ancrageStr: string;
  attenteStr: string;
  perimetreStr: string;
  espacementStr: string;
};

export type ExtraBoxState = {
  id: string;
  kind: ExtraBoxKind;
  diametreMm: number;
  valueStr: string;
  longueurStr: string;
  ancrageStr: string;
  perimetreStr: string;
  espacementStr: string;
};

export type Card = { kind: "FORME"; id: string } | { kind: "EXTRA"; id: string };
