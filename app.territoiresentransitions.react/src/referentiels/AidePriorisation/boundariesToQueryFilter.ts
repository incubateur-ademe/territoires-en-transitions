/**
 * Représente des limites entre lower et upper, utilisé pour
 * construire une query Postgrest.
 *
 * Lower et upper sont optionnels.
 * Include détermine l'opérateur à utiliser.
 *
 * Ex : lower 0, upper 10, include 'lower' équivaut à `>= 0` et `< 10`.
 */
export type TBoundary = {
  lower: number | null;
  upper: number | null;
  include: 'none' | 'lower' | 'upper' | 'both';
};

/**
 * Ajoute les limites (boundaries) à la query sur une colonne.
 *
 * Permet d'utiliser plusieurs limites pour par exemple récupérer
 * les collectivités dont la population est située entre [a et b] ou [x et y].
 */
export const boundariesToQueryFilter = <T>(
  boundaries: TBoundary[],
  column: keyof T
) => {
  if (boundaries.length > 0) {
    const filters: (string[] | null)[] = boundaries
      .map(boundary => boundaryToFilter(boundary, column as string))
      .filter(Boolean);
    return filters;
  }
  return [];
};

const boundaryToFilter = (
  {lower, upper, include}: TBoundary,
  column: string
): string[] | null => {
  const filter = [];

  // détermine si on veut filtrer strictement ou non au-dessus de la borne basse
  if (lower !== null) {
    if (include === 'lower' || include === 'both')
      filter.push(`gte."${lower}"`);
    else filter.push(`gt."${lower}"`);
  }

  // détermine si on veut filtrer strictement ou non en dessous de la borne haute
  if (upper !== null) {
    if (include === 'upper' || include === 'both')
      filter.push(`lte."${upper}"`);
    else filter.push(`lt."${upper}"`);
  }

  return filter.length ? filter.map(f => `${column}.${f}`) : null;
};
