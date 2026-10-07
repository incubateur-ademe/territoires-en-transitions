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

  it('accepte archived avec display true (référentiel archivé mais consultable dans la nav)', () => {
    const result = collectivitePreferencesSchema.safeParse({
      referentiels: {
        cae: { display: true, mode: 'archived' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'readonly' },
      },
    });

    expect(result.success).toBe(true);
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
