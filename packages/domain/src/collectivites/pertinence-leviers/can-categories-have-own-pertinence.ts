import { match } from 'ts-pattern';
import { Pertinence } from './pertinence.enum';

export const canCategoriesHaveOwnPertinence = (
  levierPertinence?: Pertinence
): boolean =>
  match(levierPertinence)
    .with('non_pertinent', () => false)
    .with('pertinent', undefined, () => true)
    .exhaustive();
