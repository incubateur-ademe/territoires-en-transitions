import {
  canCategoriesHaveOwnPertinence,
  PertinenceLevier,
} from '@tet/domain/collectivites';

const isSameVolet = (
  existing: PertinenceLevier,
  upserted: PertinenceLevier
): boolean =>
  existing.levierId === upserted.levierId &&
  existing.categorie === upserted.categorie;

const isCategorieClearedByLevier = (
  existing: PertinenceLevier,
  { levierId, categorie, pertinence }: PertinenceLevier
): boolean =>
  categorie === undefined &&
  !canCategoriesHaveOwnPertinence(pertinence) &&
  existing.levierId === levierId &&
  existing.categorie !== undefined;

const isKeptAfterUpsert = (
  existing: PertinenceLevier,
  upserted: PertinenceLevier
): boolean =>
  !isSameVolet(existing, upserted) &&
  !isCategorieClearedByLevier(existing, upserted);

export const upsertPertinence = ({
  pertinences,
  pertinence,
}: {
  pertinences: PertinenceLevier[];
  pertinence: PertinenceLevier;
}): PertinenceLevier[] => [
  ...pertinences.filter((existing) => isKeptAfterUpsert(existing, pertinence)),
  pertinence,
];
