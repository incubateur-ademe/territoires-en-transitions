import { describe, expect, it } from 'vitest';
import type { CollectiviteReferentielPreferences } from './collectivite-preferences.schema';
import {
  deriveReferentielPreferences,
  referentielPreferencesFromDisplayMap,
  toggleReferentielDisplayPreference,
} from './collectivite-referentiel-preferences.rules';

const postSwitchTePreferences: CollectiviteReferentielPreferences = {
  cae: { display: false, mode: 'archived' },
  eci: { display: false, mode: 'archived' },
  te: {
    display: true,
    mode: 'write',
    populatedFromCaeEci: {
      populatedAt: '2026-06-01T00:00:00.000Z',
      populatedBy: 'user-id',
    },
  },
};

describe('deriveReferentielPreferences', () => {
  it('positionne te en write et masque cae/eci quand aucun référentiel engagé', () => {
    expect(
      deriveReferentielPreferences({ caeEngaged: false, eciEngaged: false })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  it('positionne te en readonly quand au moins un référentiel est engagé', () => {
    expect(
      deriveReferentielPreferences({ caeEngaged: true, eciEngaged: false })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    expect(
      deriveReferentielPreferences({ caeEngaged: false, eciEngaged: true })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });

    expect(
      deriveReferentielPreferences({ caeEngaged: true, eciEngaged: true })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('retourne les prefs existantes inchangées si populatedFromCaeEci est renseigné', () => {
    expect(
      deriveReferentielPreferences(
        { caeEngaged: true, eciEngaged: true },
        postSwitchTePreferences
      )
    ).toBe(postSwitchTePreferences);
  });

  it('respecte l’invariant archived implique display false', () => {
    const result = deriveReferentielPreferences({
      caeEngaged: false,
      eciEngaged: false,
    });

    for (const pref of Object.values(result)) {
      if (pref.mode === 'archived') {
        expect(pref.display).toBe(false);
      }
    }
  });
});

describe('collectivite-referentiel-preferences.rules', () => {
  it('mappe display vers mode (te en readonly si engagée)', () => {
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

  it('mappe display vers mode (te en write si non engagée)', () => {
    expect(
      referentielPreferencesFromDisplayMap({
        cae: false,
        eci: false,
        te: true,
      })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  it('retourne les prefs existantes inchangées si populatedFromCaeEci est renseigné', () => {
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
      )
    ).toBe(existing);
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
