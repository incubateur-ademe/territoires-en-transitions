import { match } from 'ts-pattern';
import { Pertinence } from './pertinence.enum';

export const canCategoriesHaveOwnPertinence = (
  levierPertinence?: Pertinence
): boolean =>
  match(levierPertinence)
    .with('non_pertinent', () => false)
    .with('a_discuter', 'pertinent', undefined, () => true)
    .exhaustive();
