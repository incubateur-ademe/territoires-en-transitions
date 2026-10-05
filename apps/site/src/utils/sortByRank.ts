export const sortByRank = <T extends { id: number; Rang?: number | null }>(
  array: T[]
): T[] =>
  array.sort((a, b) => {
    const aRank = a.Rang ?? undefined;
    const bRank = b.Rang ?? undefined;

    if (aRank && bRank) return aRank - bRank;
    else if (aRank && !bRank) return -1;
    else if (!aRank && bRank) return 1;
    else return a.id - b.id;
  });
