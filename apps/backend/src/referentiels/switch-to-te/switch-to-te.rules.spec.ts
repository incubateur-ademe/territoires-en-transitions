import type { CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import { describe, expect, it } from 'vitest';
import { canSwitchToTe } from './switch-to-te.rules';

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
