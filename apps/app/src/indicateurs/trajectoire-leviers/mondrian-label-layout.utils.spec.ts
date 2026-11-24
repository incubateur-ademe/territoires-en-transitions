import { describe, expect, it } from 'vitest';
import {
  fitMondrianLabel,
  MeasureMondrianText,
  MONDRIAN_REFERENCE_SIZE,
  placeMondrianReferences,
} from './mondrian-label-layout.utils';

const measure: MeasureMondrianText = (text, size) => text.length * size * 0.5;

describe('fitMondrianLabel', () => {
  it('réduit et répartit le libellé sur plusieurs lignes en conservant la valeur entière', () => {
    const result = fitMondrianLabel(
      'Rénovation des bâtiments',
      '-12,3 ktCO₂e',
      { width: 100, height: 82 },
      measure
    );

    expect(result?.lines.join(' ')).toBe('Rénovation des bâtiments');
    expect(result?.labelSize).toBe(13);
    expect(result?.valueSize).toBe(12);
    expect(result?.lines.length).toBeGreaterThan(1);
  });

  it.each([
    { label: 'Électrification', value: '-1 ktCO₂e', width: 80, height: 200 },
    { label: 'Sobriété', value: '-123456,7 ktCO₂e', width: 90, height: 200 },
    { label: 'Sobriété', value: '-1 ktCO₂e', width: 200, height: 40 },
  ])(
    'déplace le texte dans la légende quand il ne tient pas à 12 px (%j)',
    ({ label, value, width, height }) => {
      expect(
        fitMondrianLabel(label, value, { width, height }, measure)
      ).toBeNull();
    }
  );

  it('mesure la valeur en graisse normale et le libellé en demi-gras', () => {
    const weights = new Map<string, number>();
    fitMondrianLabel(
      'Sobriété',
      '-10 ktCO₂e',
      { width: 200, height: 100 },
      (text, size, weight) => {
        weights.set(text, weight);
        return measure(text, size, weight);
      }
    );
    expect(weights.get('Sobriété')).toBe(600);
    expect(weights.get('-10 ktCO₂e')).toBe(400);
  });
});

describe('placeMondrianReferences', () => {
  it('garde les repères voisins dans la largeur disponible et crée une autre ligne si nécessaire', () => {
    const items = Array.from({ length: 7 }, (_, id) => ({
      id,
      rect: { x: 180, y: 200, width: 1, height: 10 },
    }));
    const placed = placeMondrianReferences(items, 180);

    expect(placed).toHaveLength(items.length);
    expect(placed.at(-1)?.row).toBe(1);
    placed.forEach((item, index) => {
      expect(item.x - MONDRIAN_REFERENCE_SIZE / 2).toBeGreaterThanOrEqual(0);
      expect(item.x + MONDRIAN_REFERENCE_SIZE / 2).toBeLessThanOrEqual(180);
      if (index && placed[index - 1].row === item.row) {
        expect(item.x - placed[index - 1].x).toBeGreaterThan(
          MONDRIAN_REFERENCE_SIZE
        );
      }
    });
  });
});
