import { getSourceLabel } from './get-source-label';

describe('getSourceLabel', () => {
  test('sans SNBC 3 servie, la SNBC 2 garde son libellé actuel', () => {
    expect(getSourceLabel('snbc', 'SNBC', 'objectif')).toBe(
      'Objectifs SNBC territorialisée'
    );
  });

  test('avec la SNBC 3 servie, les deux trajectoires sont distinguées', () => {
    expect(getSourceLabel('snbc', 'SNBC', 'objectif', { avecSnbc3: true })).toBe(
      'Objectifs SNBC2 territorialisée'
    );
    expect(
      getSourceLabel('snbc3', 'SNBC 3', 'objectif', { avecSnbc3: true })
    ).toBe('Objectifs SNBC3 territorialisée');
  });

  test('les autres sources ne dépendent pas de la SNBC 3', () => {
    expect(
      getSourceLabel('pcaet', 'Territoires & Climat', 'objectif', {
        avecSnbc3: true,
      })
    ).toBe('Objectifs Territoires & Climat');
  });
});
