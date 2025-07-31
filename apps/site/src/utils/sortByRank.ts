import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export const sortByRank = (array: StrapiItem[]): StrapiItem[] =>
  array.sort((a, b) => {
    const aRank = (a.attributes.Rang as unknown as number) ?? undefined;
    const bRank = (b.attributes.Rang as unknown as number) ?? undefined;

    if (aRank && bRank) return aRank - bRank;
    else if (aRank && !bRank) return -1;
    else if (!aRank && bRank) return 1;
    else return a.id - b.id;
  });
