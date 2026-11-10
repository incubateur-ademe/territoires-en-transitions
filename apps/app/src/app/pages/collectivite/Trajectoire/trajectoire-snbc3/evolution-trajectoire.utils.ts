import { ANNEE_REFERENCE_SNBC_V3 } from '@tet/domain/indicateurs';

type PointTrajectoire = { x: string; y?: number | null };

export type EvolutionTrajectoire = {
  /** Évolution relative depuis 2021 (-0.54 pour -54 %), `null` sans valeur. */
  evolution2030: number | null;
  evolution2050: number | null;
};

const getValeur = (points: PointTrajectoire[], annee: number) => {
  const point = points.find((p) => p.x.startsWith(`${annee}-`));
  return typeof point?.y === 'number' ? point.y : null;
};

/**
 * Évolution de la trajectoire d'un secteur entre l'année de référence de la
 * SNBC 3 (2021) et 2030 / 2050, calculée sur les valeurs affichées : elle suit
 * chaque nouvel import, au contraire d'un chiffre écrit dans un texte.
 *
 * `null` quand l'évolution n'a pas de sens : pas de valeur en 2021, ou une
 * valeur nulle ou négative (puits de l'UTCATF, CSC qui démarre à zéro).
 */
export function getEvolutionTrajectoire(
  points: PointTrajectoire[]
): EvolutionTrajectoire | null {
  const reference = getValeur(points, ANNEE_REFERENCE_SNBC_V3);
  if (reference === null || reference <= 0) {
    return null;
  }
  const evolution = (annee: number) => {
    const valeur = getValeur(points, annee);
    return valeur === null ? null : valeur / reference - 1;
  };
  const evolution2030 = evolution(2030);
  const evolution2050 = evolution(2050);
  return evolution2030 === null && evolution2050 === null
    ? null
    : { evolution2030, evolution2050 };
}

/** « -54 % », « +3 % » : signe toujours affiché. */
export const formatEvolution = (evolution: number) => {
  const pourcentage = Math.round(evolution * 100);
  return `${pourcentage > 0 ? '+' : ''}${pourcentage} %`;
};
