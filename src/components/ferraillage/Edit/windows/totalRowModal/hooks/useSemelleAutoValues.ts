import { useSemelleDualAuto } from "./useSemelleAuto";
import { formatDiametreLabel } from "../config/formeBarreLabels";

export function useSemelleAutoValues({
  active,
  equalDual,
  nbStr,
  nBarreAStr,
  nBarreBStr,
  longueurAStr,
  longueurBStr,
  ancrageStr,
  semelleDiametreAValue,
  semelleDiametreBValue,
}: {
  active: boolean;
  equalDual: boolean;
  nbStr: string;
  nBarreAStr?: string;
  nBarreBStr?: string;
  longueurAStr?: string;
  longueurBStr?: string;
  ancrageStr: string;
  semelleDiametreAValue: number;
  semelleDiametreBValue: number;
}) {
  const dual = useSemelleDualAuto({
    active,
    equalDual,
    nbStr,
    nBarreAStr,
    nBarreBStr,
    longueurAStr,
    longueurBStr,
    ancrageStr,
  });

  const semelleDiamLabelA = formatDiametreLabel(semelleDiametreAValue);
  const semelleDiamLabelB = formatDiametreLabel(semelleDiametreBValue);

  const qteLabelA = semelleDiamLabelA
    ? `Q. Fer ${semelleDiamLabelA} (m)`
    : "Q. Fer a (m)";

  const qteLabelB = semelleDiamLabelB
    ? `Q. Fer ${semelleDiamLabelB} (m)`
    : "Q. Fer b (m)";

  const ntLabelA = semelleDiamLabelA
    ? `N.T.Barre façonnées ${semelleDiamLabelA}`
    : "N.T.Barre façonnées a";

  const ntLabelB = semelleDiamLabelB
    ? `N.T.Barre façonnées ${semelleDiamLabelB}`
    : "N.T.Barre façonnées b";

  return {
    dual,
    qteLabelA,
    qteLabelB,
    ntLabelA,
    ntLabelB,
  };
}
