import { describe, expect, it } from 'vitest';
import { reconstructPageLines, TextItemLike } from './reconstruct-page-lines';

const PAGE_HEIGHT = 800;

// Fragment posé à (x, y depuis le haut), taille de police `size`.
const item = (
  str: string,
  x: number,
  yFromTop: number,
  size = 10,
  width = str.length * size * 0.5
): TextItemLike => ({
  str,
  transform: [size, 0, 0, size, x, PAGE_HEIGHT - yFromTop],
  width,
  height: size,
});

describe('reconstructPageLines', () => {
  it('regroupe les fragments d’une même ligne et les lit de haut en bas', () => {
    const lines = reconstructPageLines(
      [
        item('les écoles', 120, 200),
        item('Rénover', 40, 200),
        item('AXE 1 : BÂTIMENTS', 40, 100, 18),
      ],
      PAGE_HEIGHT
    );

    expect(lines.map((line) => line.text)).toEqual([
      'AXE 1 : BÂTIMENTS',
      'Rénover les écoles',
    ]);
    expect(lines[0].fontSize).toBe(18);
    expect(lines[0].y).toBe(100);
  });

  it('sépare deux colonnes de texte posées sur la même ligne', () => {
    const lines = reconstructPageLines(
      [
        item('OBJECTIF 1 - AMELIORER LES BATIMENTS', 40, 200, 10, 180),
        item('OBJECTIF 4 - REDUIRE LES DEPLACEMENTS', 260, 200, 10, 180),
      ],
      PAGE_HEIGHT
    );

    expect(lines.map((line) => line.text)).toEqual([
      'OBJECTIF 1 - AMELIORER LES BATIMENTS',
      'OBJECTIF 4 - REDUIRE LES DEPLACEMENTS',
    ]);
  });

  it('garde un numéro ou un libellé court sur la ligne de son texte', () => {
    const lines = reconstructPageLines(
      [
        item('2.1.3', 40, 200, 10, 25),
        item('Assurer le suivi des consommations', 90, 200),
        item('Pilote', 40, 300, 10, 30),
        item('Service bâtiments', 120, 300),
      ],
      PAGE_HEIGHT
    );

    expect(lines.map((line) => line.text)).toEqual([
      '2.1.3 Assurer le suivi des consommations',
      'Pilote Service bâtiments',
    ]);
  });

  it('ne double pas les espaces déjà présents dans les fragments', () => {
    const lines = reconstructPageLines(
      [item('Rénover ', 40, 200, 10, 40), item('les écoles', 80, 200)],
      PAGE_HEIGHT
    );

    expect(lines[0].text).toBe('Rénover les écoles');
  });

  it('colle deux fragments qui se touchent (mot coupé par pdf.js)', () => {
    const lines = reconstructPageLines(
      [item('Réno', 40, 200, 10, 20), item('ver', 60, 200)],
      PAGE_HEIGHT
    );

    expect(lines[0].text).toBe('Rénover');
  });

  it('tolère un léger décalage vertical au sein d’une ligne', () => {
    const lines = reconstructPageLines(
      [item('Budget', 40, 300), item('12 000 €', 200, 303)],
      PAGE_HEIGHT
    );

    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe('Budget 12 000 €');
  });

  it('ne double pas un texte dessiné deux fois au même endroit', () => {
    const lines = reconstructPageLines(
      [
        item('ÉTAT', 40, 100, 70),
        item('ÉTAT', 41, 100, 70),
        item('ÉTAT', 400, 100, 70),
      ],
      PAGE_HEIGHT
    );

    expect(lines.map((line) => line.text)).toEqual(['ÉTAT ÉTAT']);
  });

  it('ignore les fragments vides', () => {
    expect(reconstructPageLines([item('', 40, 100)], PAGE_HEIGHT)).toEqual([]);
  });
});
