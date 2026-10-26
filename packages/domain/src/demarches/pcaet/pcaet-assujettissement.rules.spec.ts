import { describe, expect, it } from 'vitest';
import { CollectivitePcaetObligationEnum } from './collectivite-pcaet-obligation.enum.schema';
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
    ).toBe(CollectivitePcaetObligationEnum.OBLIGATOIRE);
  });

  it('en deçà du seuil : non obligé, pas volontaire faute de démarche', () => {
    expect(
      getObligationAssujettissement({
        natureInsee: 'CC',
        population: SEUIL_POPULATION_PCAET - 1,
      })
    ).toBe(CollectivitePcaetObligationEnum.NON_OBLIGE);
  });

  it('exactement au seuil : non obligé, la comparaison est stricte', () => {
    expect(
      getObligationAssujettissement({
        natureInsee: 'CC',
        population: SEUIL_POPULATION_PCAET,
      })
    ).toBe(CollectivitePcaetObligationEnum.NON_OBLIGE);
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
