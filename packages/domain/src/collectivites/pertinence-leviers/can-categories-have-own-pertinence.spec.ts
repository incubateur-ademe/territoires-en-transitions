import { describe, expect, it } from 'vitest';
import { canCategoriesHaveOwnPertinence } from './can-categories-have-own-pertinence';
import { Pertinence, pertinenceEnumValues } from './pertinence.enum';

type OptionalPertinence = Pertinence | undefined;

const admittingLevierPertinences: OptionalPertinence[] = [
  ...pertinenceEnumValues.filter(
    (pertinence) => pertinence !== 'non_pertinent'
  ),
  undefined,
];

describe('canCategoriesHaveOwnPertinence', () => {
  it.each(admittingLevierPertinences)(
    'admet la pertinence propre des catégories sous un levier %s',
    (levierPertinence) => {
      expect(canCategoriesHaveOwnPertinence(levierPertinence)).toBe(true);
    }
  );

  it('refuse la pertinence propre des catégories sous un levier non pertinent', () => {
    expect(canCategoriesHaveOwnPertinence('non_pertinent')).toBe(false);
  });
});
