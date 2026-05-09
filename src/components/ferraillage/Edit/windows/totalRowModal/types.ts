export type FormeKind = "BARRE" | "CARRE" | "CIRCULAIRE" | "RECTANGULAIRE";
export type RowForme = FormeKind;

export type ExtraBoxKind = "EPINGLE" | "ETRIERS";

export type Card =
  | { kind: "EXTRA"; id: string }
  | { kind: "FORME"; id: string };

export type CadreCalcMode = "ESPACEMENT" | "NB_CADRE";
export type ExtraCalcMode = "ESPACEMENT" | "NB";

export type SemelleRelation =
  | "ab_equal_same_if"
  | "ab_equal_diff_if"
  | "ab_diff_same_if"
  | "ab_diff_diff_if";

export type SlabRelation =
  | "ab_equal_same_if"
  | "ab_equal_diff_if"
  | "ab_diff_same_if"
  | "ab_diff_diff_if";

export type SlabCalcMethod = "SURFACE_TOTAL" | "SURFACE_TOTAL_PER_M2";

export type SlabSpacingMode = "ESPACEMENT" | "NB_CADRE";

export type SlabSpacingRelation = "EA_EQ_EB" | "EA_NE_EB";

export type ExtraBoxPayload = {
  kind: ExtraBoxKind;
  diametreMm: number;
  n: number | null;
  longueur: number | null;
  ancrage: number | null;
  perimetre: number | null;
  espacement: number | null;
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
  extraCalcMode?: ExtraCalcMode;
  nbExtraStr?: string;
};

export type ExtraFormePayload = {
  forme: FormeKind;
  diametreMm: number | null;
  barreCategorie?: string;
  nBarre?: number | null;
  longueur?: number | null;
  largeur?: number | null;
  rayon?: number | null;
  ancrage?: number | null;
  attenteBarre?: number | null;
  perimetre?: number | null;
  espacement?: number | null;

  slabCalcMethod?: SlabCalcMethod;
  slabSurface?: number | null;
  slabQtePerM2?: number | null;
  slabPerimetre?: number | null;
  slabAncrageLineaire?: number | null;

  slabRelation?: SlabRelation;
  slabSpacingMode?: SlabSpacingMode;
  slabSpacingRelation?: SlabSpacingRelation;

  slabLongueurA?: number | null;
  slabLongueurB?: number | null;
  slabDiametreAMm?: number | null;
  slabDiametreBMm?: number | null;
  slabNBarreA?: number | null;
  slabNBarreB?: number | null;
  slabEspacementA?: number | null;
  slabEspacementB?: number | null;
  slabNbCadreA?: number | null;
  slabNbCadreB?: number | null;
};

export type PersistedRecapTotal = {
  dia: number;
  qtyM: number;
};

export type PersistedRecapLine = {
  key: string;
  label: string;
  dia: number | null;
  qtyM: number;
  nt: number;
  cutLenM: number;
  steelType?: string;
  litLabel?: string;
  splitQtyInPair?: boolean;
};

export type PersistedRecapData = {
  totals: PersistedRecapTotal[];
  linesCadres: PersistedRecapLine[];
  linesBarres: PersistedRecapLine[];
  linesExtras: PersistedRecapLine[];
};

export type FormeState = {
  id: string;
  forme: FormeKind;
  diametreMm: number | null;
  barreCategorie?: string;

  nBarreStr: string;
  longueurStr: string;
  largeurStr: string;
  rayonStr: string;
  ancrageStr: string;
  attenteStr: string;
  perimetreStr: string;
  espacementStr: string;

  cadreCalcMode?: CadreCalcMode;
  nbCadreStr?: string;

  semelleRelation?: SemelleRelation;
  semelleLongueurAStr?: string;
  semelleLongueurBStr?: string;
  semelleNBarreAStr?: string;
  semelleNBarreBStr?: string;
  semelleDiametreAMm?: number | null;
  semelleDiametreBMm?: number | null;

  slabCalcMethod?: SlabCalcMethod;
  slabSurfaceStr?: string;
  slabQtePerM2Str?: string;
  slabPerimetreStr?: string;
  slabAncrageLineaireStr?: string;

  slabRelation?: SlabRelation;
  slabSpacingMode?: SlabSpacingMode;
  slabSpacingRelation?: SlabSpacingRelation;

  slabLongueurAStr?: string;
  slabLongueurBStr?: string;
  slabDiametreAMm?: number | null;
  slabDiametreBMm?: number | null;
  slabNBarreAStr?: string;
  slabNBarreBStr?: string;
  slabEspacementAStr?: string;
  slabEspacementBStr?: string;
  slabNbCadreAStr?: string;
  slabNbCadreBStr?: string;
};

export type TotalRowModalPayload = {
  designation: string;
  typeName?: string;

  nb?: number | null;
  hauteur?: number | null;
  enrobage?: number | null;

  forme?: FormeKind;
  diametreMm?: number | null;
  barreCategorie?: string;

  nBarre?: number | null;
  longueur?: number | null;
  largeur?: number | null;
  rayon?: number | null;
  ancrage?: number | null;
  attenteBarre?: number | null;
  perimetre?: number | null;
  espacement?: number | null;

  epingle?: number | null;
  etriers?: number | null;

  extraFormes?: ExtraFormePayload[];
  extraBoxes?: ExtraBoxPayload[];

  slabCalcMethod?: SlabCalcMethod;
  slabSurface?: number | null;
  slabQtePerM2?: number | null;
  slabPerimetre?: number | null;
  slabAncrageLineaire?: number | null;

  slabRelation?: SlabRelation;
  slabSpacingMode?: SlabSpacingMode;
  slabSpacingRelation?: SlabSpacingRelation;

  slabLongueurA?: number | null;
  slabLongueurB?: number | null;
  slabDiametreAMm?: number | null;
  slabDiametreBMm?: number | null;
  slabNBarreA?: number | null;
  slabNBarreB?: number | null;
  slabEspacementA?: number | null;
  slabEspacementB?: number | null;
  slabNbCadreA?: number | null;
  slabNbCadreB?: number | null;

  persistedRecap?: PersistedRecapData;
};
