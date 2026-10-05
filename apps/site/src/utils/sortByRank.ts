type Rankable = { id: number; createdAt?: string; Rang?: number | null };

/**
 * Tri par `Rang`, puis par date de création. Pas par `id` : en Strapi 5,
 * publier une entrée la recrée sous un nouvel `id`, alors que `createdAt` est
 * recopié du brouillon et reste stable.
 */
export const sortByRank = <T extends Rankable>(array: T[]): T[] =>
  array.sort((a, b) => {
    const aRank = a.Rang ?? undefined;
    const bRank = b.Rang ?? undefined;

    if (aRank && bRank) return aRank - bRank;
    else if (aRank && !bRank) return -1;
    else if (!aRank && bRank) return 1;
    else
      return (
        (a.createdAt ?? '').localeCompare(b.createdAt ?? '') || a.id - b.id
      );
  });
