import { describe, expect, it } from 'vitest';
import {
  formatEvolution,
  getEvolutionTrajectoire,
} from './evolution-trajectoire.utils';

const point = (annee: number, y: number | null) => ({ x: `${annee}-01-01`, y });

describe('getEvolutionTrajectoire', () => {
  it('rapporte 2030 et 2050 à 2021', () => {
    const evolution = getEvolutionTrajectoire([
      point(2020, 110),
      point(2021, 100),
      point(2030, 46),
      point(2050, 4),
    ]);
    expect(evolution?.evolution2030).toBeCloseTo(-0.54);
    expect(evolution?.evolution2050).toBeCloseTo(-0.96);
  });

  it('accepte une hausse et une année manquante', () => {
    expect(
      getEvolutionTrajectoire([point(2021, 100), point(2030, 103)])
    ).toEqual({ evolution2030: expect.closeTo(0.03), evolution2050: null });
  });

  it.each([
    ['sans valeur en 2021', [point(2030, 50), point(2050, 10)]],
    ['avec une valeur nulle en 2021 (CSC)', [point(2021, 0), point(2050, -22)]],
    ['avec un puits en 2021 (UTCATF)', [point(2021, -55), point(2050, -40)]],
    ['sans valeur en 2030 ni en 2050', [point(2021, 100), point(2025, 80)]],
    ['avec des valeurs vides', [point(2021, 100), point(2030, null)]],
  ])('renvoie null %s', (_cas, points) => {
    expect(getEvolutionTrajectoire(points)).toBeNull();
  });
});

describe('formatEvolution', () => {
  it.each([
    [-0.5449, '-54 %'],
    [0.031, '+3 %'],
    [0.001, '0 %'],
  ])('%s → %s', (evolution, attendu) => {
    expect(formatEvolution(evolution)).toBe(attendu);
  });
});
