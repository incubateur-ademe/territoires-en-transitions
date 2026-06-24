import { describe, expect, it } from 'vitest';
import {
  referentielPreferencesFromDisplayMap,
  toggleReferentielDisplayPreference,
} from './collectivite-referentiel-preferences.rules';

describe('collectivite-referentiel-preferences.rules', () => {
  it('mappe display vers mode (te en readonly)', () => {
    expect(
      referentielPreferencesFromDisplayMap({
        cae: false,
        eci: true,
        te: true,
      })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('préserve populatedFromCaeEci lors du mapping display', () => {
    const existing = {
      cae: { display: true, mode: 'write' as const },
      eci: { display: true, mode: 'write' as const },
      te: {
        display: true,
        mode: 'write' as const,
        populatedFromCaeEci: {
          populatedAt: '2026-06-01T00:00:00.000Z',
          populatedBy: 'user-id',
        },
      },
    };

    expect(
      referentielPreferencesFromDisplayMap(
        { cae: true, eci: true, te: true },
        existing
      ).te.populatedFromCaeEci
    ).toEqual(existing.te.populatedFromCaeEci);
  });

  it('bascule le display d’un référentiel', () => {
    const referentiels = referentielPreferencesFromDisplayMap({
      cae: true,
      eci: true,
      te: true,
    });

    expect(toggleReferentielDisplayPreference('cae', referentiels)).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });
});
