import { levierEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { LEVIERS_TEXT } from './leviers-text';
import { toLevierOfRank, toLevierRank } from './levier-ranks';

describe('les rangs de levier', () => {
  it('rendent le levier de depart apres un aller-retour, sur toute la liste', () => {
    const roundTripped = levierEnumValues.map((levier) =>
      toLevierOfRank(toLevierRank(levier))
    );

    expect(roundTripped).toEqual([...levierEnumValues]);
  });

  it('numerotent a partir de 1, sans trou ni depassement', () => {
    const ranks = levierEnumValues.map(toLevierRank);

    expect({ first: ranks[0], last: ranks[ranks.length - 1] }).toEqual({
      first: 1,
      last: levierEnumValues.length,
    });
  });

  it('numerotent dans le prompt comme la relecture les renumerote', () => {
    const mislabelled = levierEnumValues.filter(
      (levier) => !LEVIERS_TEXT.includes(`${toLevierRank(levier)}. ${levier} —`)
    );

    expect({ checked: levierEnumValues.length, mislabelled }).toEqual({
      checked: levierEnumValues.length,
      mislabelled: [],
    });
  });
});
