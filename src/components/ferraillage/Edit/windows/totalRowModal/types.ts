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

export type SlabCalcMethod = "SURFACE_TOTAL" | "SURFACE_TOTAL_PER_M2";

export type SlabSpacingMode = "ESPACEMENT";

export type SlabSpacingRelation = "EA_EQ_EB" | "EA_NE_EB";

export type SlabRelation = "ab_equal_diff_if" | "ab_diff_same_if" | "ab_diff_diff_if";

export type ExtraFormePayload = {
  forme: "BARRE" | "CARRE" | "CIRCULAIRE" | "RECTANGULAIRE";
  diametreMm: number;
  barreCategorie?: string;
  nBarre: number | null;
  longueur: number | null;
  largeur: number | null;
  rayon: number | null;
  ancrage: number | null;
  attenteBarre: number | null;
  perimetre: number | null;
  espacement: number | null;
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

  forme: "BARRE" | "CARRE" | "CIRCULAIRE" | "RECTANGULAIRE";
  diametreMm: number;
  barreCategorie?: string;

  nBarre: number | null;
  longueur: number | null;
  largeur: number | null;
  rayon: number | null;
  ancrage: number | null;
  attenteBarre: number | null;
  perimetre: number | null;
  espacement: number | null;

  epingle?: number | null;
  etriers?: number | null;

  slabCalcMethod?: SlabCalcMethod | null;
  slabSpacingMode?: SlabSpacingMode | null;
  slabSpacingRelation?: SlabSpacingRelation | null;
  slabRelation?: SlabRelation | null;
  slabSurface?: number | null;
  slabPerimetre?: number | null;
  slabAncrageLineaire?: number | null;
  slabEspacementA?: number | null;
  slabEspacementB?: number | null;
  slabDiametreAMm?: number | null;
  slabDiametreBMm?: number | null;
  slabLongueurA?: number | null;
  slabLongueurB?: number | null;

  extraFormes?: ExtraFormePayload[];
  extraBoxes?: ExtraBoxPayload[];
};


export type FormeState = {
  id: string;
  forme: "BARRE" | "CARRE" | "CIRCULAIRE" | "RECTANGULAIRE";
  diametreMm: number;
  barreCategorie?: string;

  nBarreStr: string;
  longueurStr: string;
  largeurStr: string;
  rayonStr: string;
  ancrageStr: string;
  attenteStr: string;
  perimetreStr: string;
  espacementStr: string;

  cadreCalcMode?: "ESPACEMENT" | "NB_CADRE";
  nbCadreStr?: string;
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
  extraCalcMode?: "ESPACEMENT" | "NB";
  nbExtraStr?: string;
};

export type Card = { kind: "FORME"; id: string } | { kind: "EXTRA"; id: string };
