import { describe, expect, it } from 'vitest';
import { toSousIndicateursCapabilities } from './sous-indicateurs-capabilities.rules';

describe('toSousIndicateursCapabilities', () => {
  it('laisse un indicateur perso cumuler et modifier la structure de ses sous-indicateurs, selon son drapeau de cumul', () => {
    const perso = {
      collectiviteId: 4999,
      groupementId: null,
      identifiantReferentiel: null,
    };

    expect(
      toSousIndicateursCapabilities({
        ...perso,
        totalEstCumulDesSousIndicateurs: true,
      })
    ).toEqual({ cumul: 'enabled', canEditStructure: true });
    expect(
      toSousIndicateursCapabilities({
        ...perso,
        totalEstCumulDesSousIndicateurs: false,
      })
    ).toEqual({ cumul: 'disabled', canEditStructure: true });
  });

  it("n'offre ni cumul ni modification de structure pour un indicateur prédéfini, quel que soit son drapeau de cumul", () => {
    const predefini = {
      collectiviteId: null,
      groupementId: null,
      identifiantReferentiel: 'emission_polluants_atmo',
    };

    expect(
      toSousIndicateursCapabilities({
        ...predefini,
        totalEstCumulDesSousIndicateurs: true,
      })
    ).toEqual({ cumul: 'unavailable', canEditStructure: false });
    expect(
      toSousIndicateursCapabilities({
        ...predefini,
        totalEstCumulDesSousIndicateurs: false,
      })
    ).toEqual({ cumul: 'unavailable', canEditStructure: false });
  });
});
