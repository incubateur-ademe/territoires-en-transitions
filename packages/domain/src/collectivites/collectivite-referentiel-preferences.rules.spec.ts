import { describe, expect, it } from 'vitest';
import type { CollectiviteReferentielPreferences } from './collectivite-preferences.schema';
import { deriveReferentielPreferences } from './collectivite-referentiel-preferences.rules';

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
