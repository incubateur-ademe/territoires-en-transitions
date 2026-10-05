import { describe, expect, it } from 'vitest';
import { toTileColor } from './to-tile-color';

const MOBILISATION = [
  'Non mobilisé',
  'Peu mobilisé',
  'Bien mobilisé',
  'Très mobilisé',
] as const;

describe('toTileColor', () => {
  it('gives the strongest intensity the full group color', () => {
    expect(
      toTileColor({
        color: '#404092',
        intensity: 'Très mobilisé',
        intensityScale: MOBILISATION,
      })
    ).toBe('rgba(64,64,146,1)');
  });

  it('gives the weakest intensity a 20 % tint of the group color over white', () => {
    expect(
      toTileColor({
        color: '#404092',
        intensity: 'Non mobilisé',
        intensityScale: MOBILISATION,
      })
    ).toBe('rgba(217,217,233,1)');
  });

  it('spreads the intermediate intensities evenly between the two ends', () => {
    expect(
      toTileColor({
        color: '#404092',
        intensity: 'Peu mobilisé',
        intensityScale: MOBILISATION,
      })
    ).toBe('rgba(166,166,204,1)');
  });

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
