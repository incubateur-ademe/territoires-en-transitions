import { PertinenceLevier } from '@tet/domain/collectivites';

const isSameVolet = (
  existing: PertinenceLevier,
  pertinence: PertinenceLevier
): boolean =>
  existing.levierId === pertinence.levierId &&
  existing.categorie === pertinence.categorie;

export const upsertPertinence = ({
  pertinences,
  pertinence,
}: {
  pertinences: PertinenceLevier[];
  pertinence: PertinenceLevier;
}): PertinenceLevier[] => [
  ...pertinences.filter((existing) => !isSameVolet(existing, pertinence)),
  pertinence,
];
