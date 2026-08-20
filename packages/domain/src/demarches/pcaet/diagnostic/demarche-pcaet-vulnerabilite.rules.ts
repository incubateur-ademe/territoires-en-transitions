import {
  DemarchePcaetVulnerabiliteHorizonEnum,
  type DemarchePcaetVulnerabiliteHorizon,
  type DemarchePcaetVulnerabiliteNiveau,
} from './demarche-pcaet-vulnerabilite-niveau.enum.schema';
import type { DemarchePcaetVulnerabiliteLigne } from './demarche-pcaet-vulnerabilite.schema';

/** Champ de la ligne portant le niveau d'un horizon. */
const NIVEAU_KEYS = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: 'niveauMaintenant',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: 'niveau2050',
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: 'niveau2100',
} as const satisfies Record<
  DemarchePcaetVulnerabiliteHorizon,
  keyof DemarchePcaetVulnerabiliteLigne
>;

/** Horizons alimentés par une saisie, dans l'ordre chronologique. */
const HORIZONS_SUIVANTS = {
  [DemarchePcaetVulnerabiliteHorizonEnum.MAINTENANT]: [
    DemarchePcaetVulnerabiliteHorizonEnum.H2050,
    DemarchePcaetVulnerabiliteHorizonEnum.H2100,
  ],
  [DemarchePcaetVulnerabiliteHorizonEnum.H2050]: [
    DemarchePcaetVulnerabiliteHorizonEnum.H2100,
  ],
  [DemarchePcaetVulnerabiliteHorizonEnum.H2100]: [],
} as const satisfies Record<
  DemarchePcaetVulnerabiliteHorizon,
  readonly DemarchePcaetVulnerabiliteHorizon[]
>;

/**
 * Applique une saisie de niveau et pré-remplit les horizons plus lointains
 * **restés vides**. Renseigner le constat actuel épargne ainsi deux clics par
 * ligne, sans jamais écraser une projection que la collectivité a corrigée à la
 * main : c'est ce qui autorise l'automatisme.
 *
 * La règle est rejouée côté serveur, pour qu'un appel direct à l'API produise
 * exactement la même ligne qu'une saisie dans l'écran.
 */
export const applyNiveauCascade = ({
  ligne,
  horizon,
  niveau,
}: {
  ligne: DemarchePcaetVulnerabiliteLigne;
  horizon: DemarchePcaetVulnerabiliteHorizon;
  niveau: DemarchePcaetVulnerabiliteNiveau | null;
}): DemarchePcaetVulnerabiliteLigne => {
  const suivant: DemarchePcaetVulnerabiliteLigne = { ...ligne };
  suivant[NIVEAU_KEYS[horizon]] = niveau;
  if (niveau === null) {
    return suivant;
  }
  for (const horizonSuivant of HORIZONS_SUIVANTS[horizon]) {
    const key = NIVEAU_KEYS[horizonSuivant];
    if (suivant[key] === null) {
      suivant[key] = niveau;
    }
  }
  return suivant;
};
