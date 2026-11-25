import { describe, expect, it } from 'vitest';
import {
  SOUS_INDICATEURS_TOTAL_COLOR,
  toSousIndicateurColorOf,
} from './sous-indicateurs-colors';

describe('toSousIndicateurColorOf', () => {
  it('donne une couleur différente aux premiers sous-indicateurs', () => {
    const colorOf = toSousIndicateurColorOf([10, 11, 12, 13]);

    expect(new Set([10, 11, 12, 13].map(colorOf)).size).toBe(4);
  });

  it("garde la couleur d'un sous-indicateur quel que soit le nombre de fois où il est listé", () => {
    const colorOf = toSousIndicateurColorOf([10, 11, 10, 12]);

    expect(colorOf(12)).toBe(toSousIndicateurColorOf([10, 11, 12])(12));
  });

  it("garde l'ordre de la liste : le premier sous-indicateur prend toujours la même couleur", () => {
    expect(toSousIndicateurColorOf([7, 8])(7)).toBe(
      toSousIndicateurColorOf([3, 4, 5])(3)
    );
  });

  it('reprend les couleurs depuis le début quand il y a plus de sous-indicateurs que de couleurs', () => {
    const ids = Array.from({ length: 40 }, (_, index) => index);
    const colorOf = toSousIndicateurColorOf(ids);
    const distinctColors = new Set(ids.map(colorOf));

    expect(distinctColors.size).toBeLessThan(ids.length);
    expect(colorOf(0)).toBe(colorOf(distinctColors.size));
  });

  it('donne la première couleur à un identifiant absent de la liste', () => {
    expect(toSousIndicateurColorOf([1, 2])(99)).toBe(
      toSousIndicateurColorOf([1, 2])(1)
    );
  });

  it('ne réutilise pas la couleur du total pour un sous-indicateur', () => {
    const ids = Array.from({ length: 15 }, (_, index) => index);
    const colorOf = toSousIndicateurColorOf(ids);

    expect(ids.map(colorOf)).not.toContain(SOUS_INDICATEURS_TOTAL_COLOR);
  });
});
