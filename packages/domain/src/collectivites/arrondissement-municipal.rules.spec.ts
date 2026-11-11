import { describe, expect, it } from 'vitest';
import { getCodeCommuneOfArrondissement } from './arrondissement-municipal.rules';

describe('getCodeCommuneOfArrondissement', () => {
  it.each([
    ['75101', '75056'],
    ['75120', '75056'],
    ['69381', '69123'],
    ['69389', '69123'],
    ['13201', '13055'],
    ['13216', '13055'],
  ])('rattache l’arrondissement %s à la commune %s', (arrondissement, commune) => {
    expect(getCodeCommuneOfArrondissement(arrondissement)).toBe(commune);
  });

  it.each([
    ['la commune de Paris elle-même', '75056'],
    ['un code juste après les arrondissements de Paris', '75121'],
    ['un code juste après les arrondissements de Lyon', '69390'],
    ['un code juste avant les arrondissements de Marseille', '13200'],
    ['une commune ordinaire', '01004'],
    ['un code corse', '2A004'],
    ['un code absent', null],
  ])('renvoie null pour %s', (_, communeCode) => {
    expect(getCodeCommuneOfArrondissement(communeCode)).toBeNull();
  });
});
