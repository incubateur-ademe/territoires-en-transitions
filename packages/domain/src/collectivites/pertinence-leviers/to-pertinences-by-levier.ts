import { CategorieAction, LevierId } from '../../shared';
import { PertinenceLevier } from './pertinence-leviers.schema';
import { Pertinence } from './pertinence.enum';

export type LevierPertinences = {
  levier?: Pertinence;
  categories: Map<CategorieAction, Pertinence>;
};

const withPertinence = (
  levierPertinences: LevierPertinences,
  { categorie, pertinence }: PertinenceLevier
): LevierPertinences => {
  if (categorie === undefined) {
    return { ...levierPertinences, levier: pertinence };
  }
  return {
    ...levierPertinences,
    categories: new Map(levierPertinences.categories).set(
      categorie,
      pertinence
    ),
  };
};

export const toPertinencesByLevier = (
  pertinences: PertinenceLevier[]
): Map<LevierId, LevierPertinences> =>
  pertinences.reduce(
    (index, pertinence) =>
      index.set(
        pertinence.levierId,
        withPertinence(
          index.get(pertinence.levierId) ?? { categories: new Map() },
          pertinence
        )
      ),
    new Map<LevierId, LevierPertinences>()
  );
