import { describe, expect, it } from 'vitest';
import { buildPage, DocumentPage } from '../document/document-page';
import { cutUnits, CutUnitsOptions } from './cut-units';
import { detectHeadings } from './detect-headings';

const OPTIONS: CutUnitsOptions = {
  minTokens: 0,
  maxTokens: 10_000,
  overlapTokens: 0,
};

const page = (index: number, ...texts: string[]): DocumentPage =>
  buildPage(
    index,
    texts.map((text) => ({ text }))
  );

const cut = (pages: DocumentPage[], options: Partial<CutUnitsOptions> = {}) =>
  cutUnits(pages, detectHeadings(pages), { ...OPTIONS, ...options });

describe('cutUnits', () => {
  it('ouvre une unité par fiche, sous le chemin de son axe et de son sous-axe', () => {
    const units = cut([
      page(
        0,
        'Axe 1 : Bâtiments',
        'Orientation 1.1 : Rénover',
        'Texte introductif.'
      ),
      page(
        1,
        'Action 1.1.1 : Isoler les écoles',
        'Pilote : Service bâtiments',
        'Budget : 12 000 €'
      ),
      page(
        2,
        'Action 1.1.2 : Rénover la mairie',
        'Description de la rénovation.'
      ),
    ]);

    expect(
      units.map((unit) => [unit.kind, unit.headingPath, unit.pageStart])
    ).toEqual([
      ['section', [], 0],
      ['section', ['1 Bâtiments'], 0],
      ['fiche', ['1 Bâtiments', '1.1 Rénover'], 1],
      ['fiche', ['1 Bâtiments', '1.1 Rénover'], 2],
    ]);
    expect(units[2].text).toContain('Isoler les écoles');
    expect(units[2].text).not.toContain('Rénover la mairie');
  });

  it("ne prend pas le rappel de l'axe en bandeau d'une fiche pour une frontière", () => {
    const units = cut([
      page(
        0,
        'Axe 2 : Mobilité',
        'Action 2.1.1 : Covoiturage',
        'Axe 2 : Mobilité',
        'Suite de la fiche.'
      ),
    ]);

    expect(units).toHaveLength(2);
    expect(units[1].text).toContain('Suite de la fiche.');
  });

  it('rouvre une fiche à son titre quand seuls ses champs la trahissent', () => {
    const units = cut([
      page(
        0,
        'Axe 3 : Énergie',
        'Développer le solaire sur les toitures publiques',
        'Contexte : le territoire est ensoleillé.',
        'Pilote :',
        'Service énergie',
        'Budget :',
        '50 000 €',
        'Indicateurs de suivi :',
        'Puissance installée'
      ),
    ]);

    const fiche = units.find((unit) => unit.kind === 'fiche');
    expect(fiche?.text.startsWith('Développer le solaire')).toBe(true);
    expect(units[0].text).toBe('Axe 3 : Énergie');
  });

  it('fusionne une unité trop courte avec sa voisine, jamais deux fiches', () => {
    const units = cut(
      [
        page(
          0,
          'Axe 1 : Bâtiments',
          'Action 1.1.1 : A',
          'Court.',
          'Action 1.1.2 : B',
          'Court aussi.'
        ),
      ],
      { minTokens: 50 }
    );

    expect(units.map((unit) => unit.kind)).toEqual(['fiche', 'fiche']);
    expect(units[0].text).toContain('Axe 1 : Bâtiments');
  });

  it('fenêtre une unité trop longue avec une reprise, en gardant les pages', () => {
    const longLines = Array.from(
      { length: 40 },
      (_, i) => `Ligne ${i} de contenu assez long pour compter.`
    );
    const units = cut(
      [
        page(0, 'Action 1.1.1 : Longue', ...longLines.slice(0, 20)),
        page(1, ...longLines.slice(20)),
      ],
      { maxTokens: 120, overlapTokens: 20 }
    );

    expect(units.length).toBeGreaterThan(2);
    expect(units[0].continued).toBeUndefined();
    expect(units[1].continued).toBe(true);
    expect(units.every((unit) => unit.tokenEstimate <= 120)).toBe(true);
    expect(units.at(-1)?.pageEnd).toBe(1);
    // La reprise répète la fin de la fenêtre précédente.
    expect(units[1].lines[0].text).toBe(units[0].lines.at(-1)?.text);
  });
});
