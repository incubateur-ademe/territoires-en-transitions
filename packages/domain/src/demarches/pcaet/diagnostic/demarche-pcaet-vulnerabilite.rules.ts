import {
  DemarchePcaetVulnerabiliteHorizonEnum,
  DemarchePcaetVulnerabiliteNiveauEnum,
  type DemarchePcaetVulnerabiliteHorizon,
  type DemarchePcaetVulnerabiliteNiveau,
} from './demarche-pcaet-vulnerabilite-niveau.enum.schema';
import type {
  DemarchePcaetVulnerabilite,
  DemarchePcaetVulnerabiliteLigne,
} from './demarche-pcaet-vulnerabilite.schema';

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

/**
 * Un objectif d'adaptation n'a de sens que si le territoire est concerné à cet
 * horizon : demander une phrase pour seize domaines « non concerné » ne
 * produirait que des « RAS ».
 */
export const isObjectifRequis = (
  niveau: DemarchePcaetVulnerabiliteNiveau | null
): boolean =>
  niveau !== null &&
  niveau !== DemarchePcaetVulnerabiliteNiveauEnum.NON_CONCERNE;

const isRenseigne = (texte: string | null): boolean =>
  texte !== null && texte.trim().length > 0;

/** Une ligne est complète quand ses trois horizons sont tranchés et motivés. */
export const isVulnerabiliteLigneComplete = (
  ligne: DemarchePcaetVulnerabiliteLigne
): boolean =>
  ligne.niveauMaintenant !== null &&
  ligne.niveau2050 !== null &&
  ligne.niveau2100 !== null &&
  (!isObjectifRequis(ligne.niveau2050) || isRenseigne(ligne.objectifs2050)) &&
  (!isObjectifRequis(ligne.niveau2100) || isRenseigne(ligne.objectifs2100));

/**
 * Complétude du volet vulnérabilité : chaque domaine requis porte une ligne
 * complète. Les domaines ajoutés par la collectivité n'étant pas requis,
 * ils n'empêchent jamais la transmission.
 */
export const isDemarchePcaetVulnerabiliteComplete = (
  vulnerabilite: DemarchePcaetVulnerabilite | null | undefined
): boolean => {
  // Test permissif plutôt que strict : une photo figée avant l'arrivée de ce
  // volet porte un topic de kind `vulnerabilite` sans la clé, et le jsonb est
  // relu sans validation.
  if (!vulnerabilite) {
    return false;
  }
  const lignesParDomaine = new Map(
    vulnerabilite.lignes.map((ligne) => [ligne.domaineId, ligne])
  );
  return vulnerabilite.domaines
    .filter((domaine) => domaine.requis)
    .every((domaine) => {
      const ligne = lignesParDomaine.get(domaine.id);
      return ligne !== undefined && isVulnerabiliteLigneComplete(ligne);
    });
};
