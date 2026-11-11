import { appLabels } from '@/app/labels/catalog';
import { describe, expect, it } from 'vitest';
import {
  filtreSourceToLabel,
  getFiltresSourceDisponibles,
  isSeuleTrajectoireSelectionnee,
} from './use-source-filter';

describe('getFiltresSourceDisponibles', () => {
  it('sans snbc3 : options inchangées', () => {
    expect(getFiltresSourceDisponibles(['snbc', 'pcaet', 'rare'])).toEqual({
      avecSnbc3: false,
      options: ['snbc', 'pcaet', 'opendata'],
    });
  });

  it('avec snbc3 : option à part, hors open data', () => {
    expect(getFiltresSourceDisponibles(['snbc', 'snbc3', 'pcaet'])).toEqual({
      avecSnbc3: true,
      options: ['snbc', 'snbc3', 'pcaet'],
    });
  });

  it('avec snbc3 et une source open data', () => {
    expect(getFiltresSourceDisponibles(['snbc', 'snbc3', 'citepa'])).toEqual({
      avecSnbc3: true,
      options: ['snbc', 'snbc3', 'opendata'],
    });
  });

  it('aucune source disponible', () => {
    expect(getFiltresSourceDisponibles([])).toEqual({
      avecSnbc3: false,
      options: [],
    });
  });
});

describe('filtreSourceToLabel', () => {
  it('la SNBC 2 devient « SNBC2 » quand la SNBC 3 est servie', () => {
    expect(filtreSourceToLabel('snbc', false)).toBe(appLabels.sourceSnbc);
    expect(filtreSourceToLabel('snbc', true)).toBe(appLabels.sourceSnbc2);
    expect(filtreSourceToLabel('snbc3', true)).toBe(appLabels.sourceSnbc3);
  });
});

describe('isSeuleTrajectoireSelectionnee', () => {
  it.each([
    [['snbc'], true],
    [['snbc3'], true],
    [['snbc', 'snbc3'], false],
    [['snbc3', 'pcaet'], false],
    [['pcaet'], false],
    [[], false],
  ] as const)('%j → %s', (filtres, attendu) => {
    expect(isSeuleTrajectoireSelectionnee([...filtres])).toBe(attendu);
  });
});
