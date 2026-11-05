import { CalculScoreIndicatif } from '@tet/domain/referentiels';

/** Année de référence du calcul, pour les types qui en ont une */
export const getAnneeReference = (
  calcul: CalculScoreIndicatif | null
): number | null =>
  calcul?.type === 'progression_snbc' || calcul?.type === 'reduction'
    ? calcul.anneeDepart
    : null;

/** Valeur de l'année de référence manquante au calcul */
export type ValeurReferenceManquante = {
  /** `reduction` : résultat de départ ; `progression_snbc` : objectif SNBC de départ */
  type: 'reduction' | 'progression_snbc';
  annee: number;
};

/**
 * Valeur de l'année de référence qui manque au calcul, `null` sinon. Pour
 * `progression_snbc`, c'est l'objectif SNBC de départ : s'il manque, la
 * trajectoire est très probablement absente et le calcul restera impossible
 * quel que soit le résultat sélectionné.
 */
export const getValeurReferenceManquante = (
  calcul: CalculScoreIndicatif | null
): ValeurReferenceManquante | null => {
  if (calcul?.type === 'reduction' && calcul.resultatDepart === null) {
    return { type: 'reduction', annee: calcul.anneeDepart };
  }
  if (
    calcul?.type === 'progression_snbc' &&
    calcul.objectifSnbcDepart === null
  ) {
    return { type: 'progression_snbc', annee: calcul.anneeDepart };
  }
  return null;
};

/**
 * Écarte les lignes antérieures à l'année de référence, qui ne peuvent pas
 * être prises en compte dans le calcul. La ligne sélectionnée est toujours
 * conservée pour pouvoir être désélectionnée.
 */
export const filterLignesFromAnneeReference = <
  T extends { id: number; annee: number }
>(
  lignes: T[],
  anneeReference: number | null,
  selectionneeId: number | null
): T[] =>
  anneeReference === null
    ? lignes
    : lignes.filter(
        (ligne) => ligne.annee >= anneeReference || ligne.id === selectionneeId
      );
