import { describe, expect, it } from 'vitest';
import { toHeaderColor, toTileColor } from './to-tile-color';

const MOBILISATION = [
  'Non mobilisé',
  'Peu mobilisé',
  'Bien mobilisé',
  'Très mobilisé',
] as const;

describe('toTileColor', () => {
  it('gives the weakest intensity a 50 % tint of the group color over white', () => {
    expect(
      toTileColor({
        color: '#404092',
        intensity: 'Non mobilisé',
        intensityScale: MOBILISATION,
      })
    ).toBe('rgba(160,160,201,1)');
  });

  it.each(['Peu mobilisé', 'Bien mobilisé', 'Très mobilisé'] as const)(
    'gives %s the full group color',
    (intensity) => {
      expect(
        toTileColor({
          color: '#404092',
          intensity,
          intensityScale: MOBILISATION,
        })
      ).toBe('rgba(64,64,146,1)');
    }
  );

  it('gives the full group color when the scale has a single intensity', () => {
    expect(
      toTileColor({
        color: '#404092',
        intensity: 'Mobilisé',
        intensityScale: ['Mobilisé'],
      })
    ).toBe('rgba(64,64,146,1)');
  });
});

describe('toHeaderColor', () => {
  it('gives a 55 % tint of the group color over white', () => {
    expect(toHeaderColor('#404092')).toBe('rgba(150,150,195,1)');
  });
});
