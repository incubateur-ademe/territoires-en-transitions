import { describe, expect, it } from 'vitest';
import {
  estNatureSupraPcaet,
  getTypePorteurSupra,
  TypePorteurSupraEnum,
} from './pcaet-porteur-supra.rules';

describe('estNatureSupraPcaet', () => {
  it.each(['SMF', 'SMO', 'SIVU', 'SIVOM', 'POLEM', 'PETR'] as const)(
    'un syndicat ou un pôle porte un PCAET pour ses EPCI : %s',
    (nature) => {
      expect(estNatureSupraPcaet(nature)).toBe(true);
    }
  );

  it.each(['CC', 'CA', 'CU', 'METRO', 'EPT'] as const)(
    'un EPCI à fiscalité propre n’est pas un Supra : %s',
    (nature) => {
      expect(estNatureSupraPcaet(nature)).toBe(false);
    }
  );

  it('une nature inconnue n’est pas un Supra', () => {
    expect(estNatureSupraPcaet(null)).toBe(false);
  });
});

describe('getTypePorteurSupra', () => {
  it.each([
    ['PETR', TypePorteurSupraEnum.PETR],
    ['POLEM', TypePorteurSupraEnum.POLE_METROPOLITAIN],
    ['SMF', TypePorteurSupraEnum.SYNDICAT_MIXTE],
    ['SMO', TypePorteurSupraEnum.SYNDICAT_MIXTE],
    ['SIVU', TypePorteurSupraEnum.SYNDICAT_INTERCOMMUNAL],
  ] as const)('%s → %s', (nature, type) => {
    expect(getTypePorteurSupra(nature)).toBe(type);
  });

  it('un EPCI à fiscalité propre n’a pas de type de Supra', () => {
    expect(getTypePorteurSupra('CC')).toBeNull();
  });
});
