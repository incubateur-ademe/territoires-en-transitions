import { describe, expect, it } from 'vitest';
import { toSousIndicateursCapabilities } from './sous-indicateurs-capabilities.rules';

describe('toSousIndicateursCapabilities', () => {
  it('laisse un indicateur perso afficher un total et modifier la structure de ses sous-indicateurs', () => {
    expect(
      toSousIndicateursCapabilities({
        collectiviteId: 4999,
        groupementId: null,
        identifiantReferentiel: null,
      })
    ).toEqual({ canTotaliser: true, canEditStructure: true });
  });

  it("n'offre ni total ni modification de structure pour un indicateur prédéfini", () => {
    expect(
      toSousIndicateursCapabilities({
        collectiviteId: null,
        groupementId: null,
        identifiantReferentiel: 'emission_polluants_atmo',
      })
    ).toEqual({ canTotaliser: false, canEditStructure: false });
  });
});
