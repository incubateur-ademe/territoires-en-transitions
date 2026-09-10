import { describe, expect, it } from 'vitest';
import { DemarchePcaetObligationEnum } from './demarche-pcaet-obligation.enum.schema';
import {
  estNaturePorteusePcaet,
  getObligationAssujettissement,
  SEUIL_POPULATION_PCAET,
} from './pcaet-assujettissement.rules';

describe('estNaturePorteusePcaet', () => {
  it.each(['CC', 'CA', 'CU', 'METRO'] as const)(
    'un EPCI à fiscalité propre porte un PCAET : %s',
    (nature) => {
      expect(estNaturePorteusePcaet(nature)).toBe(true);
    }
  );

  it('un établissement public territorial en porte un aussi', () => {
    expect(estNaturePorteusePcaet('EPT')).toBe(true);
  });

  it.each(['SMF', 'SMO', 'SIVU', 'SIVOM', 'POLEM', 'PETR'] as const)(
    'un syndicat ou un pôle n’en porte pas : %s',
    (nature) => {
      expect(estNaturePorteusePcaet(nature)).toBe(false);
    }
  );

  it('une nature inconnue n’en porte pas', () => {
    expect(estNaturePorteusePcaet(null)).toBe(false);
  });
});

describe('getObligationAssujettissement', () => {
  it('au-dessus du seuil : obligatoire', () => {
    expect(
      getObligationAssujettissement({
        natureInsee: 'CA',
        population: SEUIL_POPULATION_PCAET + 1,
      })
    ).toBe(DemarchePcaetObligationEnum.OBLIGATOIRE);
  });

  it('en deçà du seuil : volontaire', () => {
    expect(
      getObligationAssujettissement({
        natureInsee: 'CC',
        population: SEUIL_POPULATION_PCAET - 1,
      })
    ).toBe(DemarchePcaetObligationEnum.VOLONTAIRE);
  });

  it('exactement au seuil : volontaire, la comparaison est stricte', () => {
    expect(
      getObligationAssujettissement({
        natureInsee: 'CC',
        population: SEUIL_POPULATION_PCAET,
      })
    ).toBe(DemarchePcaetObligationEnum.VOLONTAIRE);
  });

  it('population inconnue : rien à affirmer', () => {
    expect(
      getObligationAssujettissement({ natureInsee: 'CA', population: null })
    ).toBeNull();
  });

  it('un syndicat n’est jamais assujetti, même très peuplé', () => {
    expect(
      getObligationAssujettissement({ natureInsee: 'SMF', population: 500_000 })
    ).toBeNull();
  });
});
