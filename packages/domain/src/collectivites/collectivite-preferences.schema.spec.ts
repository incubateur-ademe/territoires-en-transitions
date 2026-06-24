import { describe, expect, it } from 'vitest';
import {
  collectivitePreferencesSchema,
  defaultCollectivitePreferences,
  getReferentielDisplayMap,
} from './collectivite-preferences.schema';

describe('collectivite-preferences.schema', () => {
  it('valide les préférences par défaut', () => {
    expect(
      collectivitePreferencesSchema.safeParse(defaultCollectivitePreferences)
        .success
    ).toBe(true);
  });

  it('rejette archived avec display true', () => {
    const result = collectivitePreferencesSchema.safeParse({
      referentiels: {
        cae: { display: true, mode: 'archived' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'readonly' },
      },
    });

    expect(result.success).toBe(false);
  });

  it('extrait la carte display depuis les préférences structurées', () => {
    expect(
      getReferentielDisplayMap(defaultCollectivitePreferences.referentiels)
    ).toEqual({
      cae: true,
      eci: true,
      te: true,
    });
  });
});
