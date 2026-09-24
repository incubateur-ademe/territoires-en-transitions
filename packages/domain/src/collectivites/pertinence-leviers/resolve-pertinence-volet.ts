import { canCategoriesHaveOwnPertinence } from './can-categories-have-own-pertinence';
import { Pertinence } from './pertinence.enum';

export type PertinenceVoletEffective =
  | { kind: 'mobilise' }
  | { kind: 'heritee_du_levier' }
  | { kind: 'propre'; pertinence?: Pertinence };

export const resolvePertinenceVolet = ({
  isMobilise,
  levierPertinence,
  voletPertinence,
}: {
  isMobilise: boolean;
  levierPertinence?: Pertinence;
  voletPertinence?: Pertinence;
}): PertinenceVoletEffective => {
  if (isMobilise) {
    return { kind: 'mobilise' };
  }
  if (!canCategoriesHaveOwnPertinence(levierPertinence)) {
    return { kind: 'heritee_du_levier' };
  }
  if (voletPertinence === undefined) {
    return { kind: 'propre' };
  }
  return { kind: 'propre', pertinence: voletPertinence };
};
