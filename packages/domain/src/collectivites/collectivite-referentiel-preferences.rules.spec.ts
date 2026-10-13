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
    expect(deriveReferentielPreferences({ cae: 'vide', eci: 'vide' })).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  it('positionne te en readonly quand au moins un référentiel est engagé', () => {
    expect(
      deriveReferentielPreferences({ cae: 'engage', eci: 'vide' })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });

    expect(
      deriveReferentielPreferences({ cae: 'vide', eci: 'engage' })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });

    expect(
      deriveReferentielPreferences({ cae: 'engage', eci: 'engage' })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('retourne les prefs existantes inchangées si populatedFromCaeEci est renseigné', () => {
    expect(
      deriveReferentielPreferences(
        { cae: 'engage', eci: 'engage' },
        postSwitchTePreferences
      )
    ).toBe(postSwitchTePreferences);
  });

  it('force te readonly et eci write, et archive le cae vide d’un syndicat', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'vide',
        eci: 'vide',
        isSyndicat: true,
      })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('garde en write le cae engagé d’un syndicat', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'engage',
        eci: 'vide',
        isSyndicat: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('n’archive rien quand la bascule est bloquée, même sans référentiel engagé', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'vide',
        eci: 'vide',
        hasSwitchToTeBlocker: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('garde en write le référentiel superficiel d’une collectivité engagée dont la bascule est bloquée', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'engage',
        eci: 'superficiel',
        hasSwitchToTeBlocker: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('applique la règle de blocage quand la collectivité est aussi un syndicat', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'superficiel',
        eci: 'vide',
        hasSwitchToTeBlocker: true,
        isSyndicat: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('ne modifie pas une collectivité déjà basculée dont la bascule serait bloquée', () => {
    expect(
      deriveReferentielPreferences(
        { cae: 'engage', eci: 'engage', hasSwitchToTeBlocker: true },
        postSwitchTePreferences
      )
    ).toBe(postSwitchTePreferences);
  });

  it('force te readonly, cae et eci write pour un DROM sans référentiel engagé', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'vide',
        eci: 'vide',
        isDrom: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('applique la règle syndicat quand la collectivité est aussi en DROM', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'vide',
        eci: 'vide',
        isSyndicat: true,
        isDrom: true,
      })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('ne modifie pas un syndicat ou un DROM déjà basculé', () => {
    expect(
      deriveReferentielPreferences(
        { cae: 'engage', eci: 'engage', isSyndicat: true, isDrom: true },
        postSwitchTePreferences
      )
    ).toBe(postSwitchTePreferences);
  });

  it('garde dans la navigation un référentiel archivé au remplissage superficiel', () => {
    expect(
      deriveReferentielPreferences({ cae: 'superficiel', eci: 'vide' })
    ).toEqual({
      cae: { display: true, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });

    expect(
      deriveReferentielPreferences({ cae: 'engage', eci: 'superficiel' })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('garde en écriture un référentiel actif sans passer TE en lecture seule', () => {
    expect(deriveReferentielPreferences({ cae: 'actif', eci: 'vide' })).toEqual(
      {
        cae: { display: true, mode: 'write' },
        eci: { display: false, mode: 'archived' },
        te: { display: true, mode: 'write' },
      }
    );

    expect(
      deriveReferentielPreferences({ cae: 'actif', eci: 'actif' })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'write' },
    });
  });

  it('garde en écriture un référentiel actif à côté d’un référentiel engagé', () => {
    expect(
      deriveReferentielPreferences({ cae: 'engage', eci: 'actif' })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('garde en écriture le cae actif d’un syndicat', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'actif',
        eci: 'vide',
        isSyndicat: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
  });

  it('garde le cae archivé d’un syndicat dans la navigation dès qu’il contient des données', () => {
    expect(
      deriveReferentielPreferences({
        cae: 'superficiel',
        eci: 'vide',
        isSyndicat: true,
      })
    ).toEqual({
      cae: { display: true, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    });
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

  it('ne change que la visibilité d’un référentiel archivé', () => {
    const referentiels: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    };

    const hidden = toggleReferentielDisplayPreference('cae', referentiels);
    expect(hidden).toEqual({
      ...referentiels,
      cae: { display: false, mode: 'archived' },
    });
    expect(toggleReferentielDisplayPreference('cae', hidden)).toEqual(
      referentiels
    );
  });

  it('ne désarchive pas un référentiel archivé visible quand on bascule un autre référentiel', () => {
    const referentiels: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    };

    expect(toggleReferentielDisplayPreference('te', referentiels)).toEqual({
      cae: { display: true, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: false, mode: 'write' },
    });

    expect(
      toggleReferentielDisplayPreference('eci', {
        cae: { display: true, mode: 'archived' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'readonly' },
      })
    ).toEqual({
      cae: { display: true, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    });
  });

  it('ne change que la visibilité de te, sans toucher à son mode', () => {
    const referentiels: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    };

    const hidden = toggleReferentielDisplayPreference('te', referentiels);
    expect(hidden).toEqual({
      ...referentiels,
      te: { display: false, mode: 'readonly' },
    });
    expect(toggleReferentielDisplayPreference('te', hidden)).toEqual(
      referentiels
    );
  });

  it('conserve la visibilité de te quand on masque un référentiel en écriture', () => {
    expect(
      toggleReferentielDisplayPreference('cae', {
        cae: { display: true, mode: 'write' },
        eci: { display: false, mode: 'archived' },
        te: { display: false, mode: 'readonly' },
      })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: false, mode: 'write' },
    });
  });

  it('garde te en écriture quand on masque un référentiel actif à côté d’un autre', () => {
    expect(
      toggleReferentielDisplayPreference('cae', {
        cae: { display: true, mode: 'write' },
        eci: { display: true, mode: 'write' },
        te: { display: true, mode: 'write' },
      })
    ).toEqual({
      cae: { display: false, mode: 'archived' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'write' },
    });
  });

  it('ne modifie pas les préférences d’une collectivité déjà basculée', () => {
    expect(
      toggleReferentielDisplayPreference('cae', postSwitchTePreferences)
    ).toBe(postSwitchTePreferences);
  });
});
