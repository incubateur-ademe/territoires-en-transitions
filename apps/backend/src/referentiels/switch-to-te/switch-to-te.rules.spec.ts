import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import { canSwitchToTe, getSwitchToTeBlockers } from './switch-to-te.rules';

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
      getSwitchToTeBlockers({ cotActif: true, referentielsEnWrite: [] })
    ).toEqual([{ type: 'COT_ACTIVE' }]);
  });

  test('audit en cours sur cae → AUDIT_IN_PROGRESS', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
        referentielsEnWrite: [{ referentiel: 'cae', status: 'audit_en_cours' }],
      })
    ).toEqual([{ type: 'AUDIT_IN_PROGRESS', referentiel: 'cae' }]);
  });

  test('demande envoyée sur eci → AUDIT_REQUEST_IN_PROGRESS', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: false,
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
        referentielsEnWrite: [
          { referentiel: 'cae', status: 'audit_valide' },
          { referentiel: 'eci', status: 'non_demandee' },
        ],
      })
    ).toEqual([]);
  });

  test('multi-blocages : COT en premier puis cae avant eci', () => {
    expect(
      getSwitchToTeBlockers({
        cotActif: true,
        referentielsEnWrite: [
          { referentiel: 'cae', status: 'audit_en_cours' },
          { referentiel: 'eci', status: 'demande_envoyee' },
        ],
      })
    ).toEqual([
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
        referentielsEnWrite: [],
      })
    ).toEqual([]);
  });
});
