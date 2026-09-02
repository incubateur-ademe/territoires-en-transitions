import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { describe, expect, it, test } from 'vitest';
import {
  buildPostSwitchPreferences,
  canSwitchToTe,
  getSwitchToTeBlockers,
} from './switch-to-te.rules';

const POPULATED = {
  populatedAt: '2026-07-16T10:00:00.000Z',
  populatedBy: 'user-42',
};

describe('buildPostSwitchPreferences', () => {
  test('archive CAE engagée en la gardant dans la nav → te en write avec populatedFromCaeEci', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    };

    expect(
      buildPostSwitchPreferences(prefs, POPULATED, { cae: true, eci: false })
    ).toEqual({
      // CAE engagée (contenait des données) → archivée mais conservée dans la nav
      cae: { mode: 'archived', display: true },
      // ECI jamais engagée → inchangée, reste hors nav
      eci: { mode: 'archived', display: false },
      te: { mode: 'write', display: true, populatedFromCaeEci: POPULATED },
    });
  });

  test('archive CAE et ECI en write : display suit l’engagement de chacune', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    };

    expect(
      buildPostSwitchPreferences(prefs, POPULATED, { cae: true, eci: false })
    ).toEqual({
      cae: { mode: 'archived', display: true },
      // ECI en write mais sans activité suffisante → archivée ET hors nav
      eci: { mode: 'archived', display: false },
      te: { mode: 'write', display: true, populatedFromCaeEci: POPULATED },
    });
  });

  test('une ref en write non engagée est archivée et retirée de la nav', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'write' },
      eci: { display: true, mode: 'write' },
      te: { display: true, mode: 'readonly' },
    };

    const result = buildPostSwitchPreferences(prefs, POPULATED, {
      cae: false,
      eci: false,
    });
    expect(result.cae).toEqual({ mode: 'archived', display: false });
    expect(result.eci).toEqual({ mode: 'archived', display: false });
  });

  test('laisse inchangée une ref déjà archived', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    };

    // même si l'engagement ECI était "true", une ref déjà archived n'est pas retouchée
    const result = buildPostSwitchPreferences(prefs, POPULATED, {
      cae: true,
      eci: true,
    });
    expect(result.eci).toEqual({ mode: 'archived', display: false });
  });
});

describe('canSwitchToTe', () => {
  it('retourne true quand TE readonly et CAE engagé', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: true, mode: 'write' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    };

    expect(canSwitchToTe(prefs)).toBe(true);
  });

  it('retourne false pour une CT non engagée (TE en write)', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'write' },
    };

    expect(canSwitchToTe(prefs)).toBe(false);
  });

  it('retourne false quand TE readonly mais aucune source à migrer', () => {
    const prefs: CollectiviteReferentielPreferences = {
      cae: { display: false, mode: 'archived' },
      eci: { display: false, mode: 'archived' },
      te: { display: true, mode: 'readonly' },
    };

    expect(canSwitchToTe(prefs)).toBe(false);
  });

  it('retourne false quand la bascule a déjà été effectuée', () => {
    const prefs: CollectiviteReferentielPreferences = {
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

    expect(canSwitchToTe(prefs)).toBe(false);
  });
});

describe('getSwitchToTeBlockers', () => {
  test('COT actif seul → un blocage COT_ACTIVE', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: true,
        isSyndicat: false,
        referentielsEnWrite: [],
      })
    ).toEqual([{ type: 'COT_ACTIVE' }]);
  });

  test('collectivité syndicat seule → un blocage COLLECTIVITE_IS_SYNDICAT', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
        isSyndicat: true,
        referentielsEnWrite: [],
      })
    ).toEqual([{ type: 'COLLECTIVITE_IS_SYNDICAT' }]);
  });

  test('audit en cours sur cae → AUDIT_IN_PROGRESS', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
        isSyndicat: false,
        referentielsEnWrite: [{ referentiel: 'cae', status: 'audit_en_cours' }],
      })
    ).toEqual([{ type: 'AUDIT_IN_PROGRESS', referentiel: 'cae' }]);
  });

  test('demande envoyée sur eci → AUDIT_REQUEST_IN_PROGRESS', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
        isSyndicat: false,
        referentielsEnWrite: [
          { referentiel: 'eci', status: 'demande_envoyee' },
        ],
      })
    ).toEqual([{ type: 'AUDIT_REQUEST_IN_PROGRESS', referentiel: 'eci' }]);
  });

  test('ref en write non bloquant (audit_valide / non_demandee)', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
        isSyndicat: false,
        referentielsEnWrite: [
          { referentiel: 'cae', status: 'audit_valide' },
          { referentiel: 'eci', status: 'non_demandee' },
        ],
      })
    ).toEqual([]);
  });

  test('multi-blocages : syndicat puis COT puis cae avant eci', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: true,
        isSyndicat: true,
        referentielsEnWrite: [
          { referentiel: 'cae', status: 'audit_en_cours' },
          { referentiel: 'eci', status: 'demande_envoyee' },
        ],
      })
    ).toEqual([
      { type: 'COLLECTIVITE_IS_SYNDICAT' },
      { type: 'COT_ACTIVE' },
      { type: 'AUDIT_IN_PROGRESS', referentiel: 'cae' },
      { type: 'AUDIT_REQUEST_IN_PROGRESS', referentiel: 'eci' },
    ]);
  });

  test("un ref hors write n'est simplement pas dans la liste fournie", () => {
    // le filtrage mode==='write' est fait par l'appelant ;
    // ici on vérifie qu'une liste vide ne produit aucun blocage
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
        isSyndicat: false,
        referentielsEnWrite: [],
      })
    ).toEqual([]);
  });
});
