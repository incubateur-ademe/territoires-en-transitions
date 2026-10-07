import { round, sum } from 'es-toolkit';
import { describe, expect, it } from 'vitest';
import { levierIdEnumValues } from './levier.enum';
import { POTENTIEL_SHARE_BY_LEVIER } from './potentiel-share-by-levier.constants';

describe('POTENTIEL_SHARE_BY_LEVIER', () => {
  it.each(levierIdEnumValues)(
    'répartit tout le potentiel du levier %s entre les six catégories',
    (levierId) => {
      const total = sum(Object.values(POTENTIEL_SHARE_BY_LEVIER[levierId]));

      expect(round(total, 6)).toBe(1);
    }
  );

  it.each(levierIdEnumValues)(
    'ne donne aucune part négative à une catégorie du levier %s',
    (levierId) => {
      const shares = Object.values(POTENTIEL_SHARE_BY_LEVIER[levierId]);

      expect(shares.every((share) => share >= 0)).toBe(true);
    }
  );
});
