import { CategorieAction, LevierId } from '@tet/domain/shared';

export type FicheVolet = {
  ficheId: number;
  levierId: LevierId;
  categorie: CategorieAction;
};

export type LevierVolets = {
  levierId: LevierId;
  ficheIdsByCategorie: Record<CategorieAction, number[]>;
};

const toEmptyCategories = (): Record<CategorieAction, number[]> => ({
  amenagement: [],
  planification: [],
  financement: [],
  gouvernance: [],
  exemplarite: [],
  sensibilisation: [],
});

const sortedUnique = (ficheIds: number[]): number[] =>
  [...new Set(ficheIds)].sort((a, b) => a - b);

const toSortedCategories = (
  categories: Record<CategorieAction, number[]>
): Record<CategorieAction, number[]> => ({
  amenagement: sortedUnique(categories.amenagement),
  planification: sortedUnique(categories.planification),
  financement: sortedUnique(categories.financement),
  gouvernance: sortedUnique(categories.gouvernance),
  exemplarite: sortedUnique(categories.exemplarite),
  sensibilisation: sortedUnique(categories.sensibilisation),
});

export const groupVoletsByLevier = (volets: FicheVolet[]): LevierVolets[] => {
  const byLevier = volets.reduce<
    Map<LevierId, Record<CategorieAction, number[]>>
  >((acc, { ficheId, levierId, categorie }) => {
    const categories = acc.get(levierId) ?? toEmptyCategories();
    return acc.set(levierId, {
      ...categories,
      [categorie]: [...categories[categorie], ficheId],
    });
  }, new Map());

  return [...byLevier.entries()].map(([levierId, categories]) => ({
    levierId,
    ficheIdsByCategorie: toSortedCategories(categories),
  }));
};
