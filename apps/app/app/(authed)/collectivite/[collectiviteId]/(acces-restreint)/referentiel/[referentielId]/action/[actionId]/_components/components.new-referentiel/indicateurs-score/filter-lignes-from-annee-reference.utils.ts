import { CalculScoreIndicatif } from '@tet/domain/referentiels';

/** Année de référence du calcul, pour les types qui en ont une */
export const getAnneeReference = (
  calcul: CalculScoreIndicatif | null
): number | null =>
  calcul?.type === 'progression_snbc' || calcul?.type === 'reduction'
    ? calcul.anneeDepart
    : null;

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
