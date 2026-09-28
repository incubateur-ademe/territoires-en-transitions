import { describe, expect, it } from 'vitest';
import { buildPage, DocumentPage, PageLine } from '../document/document-page';
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

  it('fusionne une unité trop courte avec sa voisine, jamais une fiche', () => {
    const units = cut(
      [
        page(
          0,
          'Axe 1 : Bâtiments',
          'Introduction.',
          'Orientation 1.1 : Rénover',
          'Action 1.1.1 : A',
          'Court.',
          'Action 1.1.2 : B',
          'Court aussi.'
        ),
      ],
      { minTokens: 50 }
    );

    expect(units.map((unit) => unit.kind)).toEqual([
      'section',
      'fiche',
      'fiche',
    ]);
    expect(units[0].text).toContain('Orientation 1.1 : Rénover');
  });

  it("ne fait prendre à une fiche ni ce qui la précède, ni l'introduction de l'axe suivant", () => {
    const units = cut(
      [
        page(
          0,
          'SOMMAIRE',
          'Action 1.1 : A',
          'Court.',
          'Axe 2 : Mobilité',
          'Introduction de l’axe.',
          'Action 2.1 : B',
          'Court aussi.'
        ),
      ],
      { minTokens: 50 }
    );

    expect(units.map((unit) => [unit.kind, unit.lines[0].text])).toEqual([
      ['section', 'SOMMAIRE'],
      ['fiche', 'Action 1.1 : A'],
      ['section', 'Axe 2 : Mobilité'],
      ['fiche', 'Action 2.1 : B'],
    ]);
  });

  it('suit les parties du document et découpe les fiches à titre numéroté en grande police', () => {
    const corps = (text: string): PageLine => ({ text, fontSize: 12 });
    const lyonPage = (index: number, ...lines: PageLine[]) =>
      buildPage(index, lines);
    const pages: DocumentPage[] = [
      lyonPage(0, { text: "PLAN D'ACTIONS", fontSize: 70 }),
      lyonPage(
        1,
        { text: 'I. TOUS HÉROS', fontSize: 70 },
        { text: 'ORDINAIRES', fontSize: 70 },
        corps('Vision : l’engagement de tous, une transformation sociétale.')
      ),
      lyonPage(
        2,
        { text: 'I. TOUS HÉROS ORDINAIRES', fontSize: 12 },
        { text: 'ANCRER L’ADMINISTRATION', fontSize: 20 },
        { text: '1 DANS L’ÉCO-RESPONSABILITÉ', fontSize: 40 },
        corps(
          'OBJECTIF : Renforcer l’action de la métropole sur son patrimoine.'
        ),
        { text: 'LES OUTILS', fontSize: 12 },
        corps('Feuille de route exemplarité de l’administration publique.')
      ),
      lyonPage(
        3,
        { text: 'I. TOUS HÉROS ORDINAIRES', fontSize: 12 },
        { text: 'FAVORISER LES INITIATIVES LOCALES', fontSize: 20 },
        { text: '2 DES COMMUNES', fontSize: 40 },
        corps('OBJECTIF : Accompagner l’engagement des communes du territoire.')
      ),
      lyonPage(
        4,
        { text: 'ENGAGEMENT', fontSize: 70 },
        { text: 'DES PARTENAIRES', fontSize: 70 },
        corps(
          'Les partenaires s’engagent à leur échelle sur plusieurs actions.'
        )
      ),
    ];
    const units = cutUnits(pages, detectHeadings(pages), OPTIONS);

    expect(
      units.map((unit) => [
        unit.kind,
        unit.section,
        unit.headingPath,
        unit.lines[0].text,
      ])
    ).toEqual([
      ['section', "PLAN D'ACTIONS", [], "PLAN D'ACTIONS"],
      ['section', "PLAN D'ACTIONS", [], 'I. TOUS HÉROS'],
      [
        'fiche',
        "PLAN D'ACTIONS",
        ['I TOUS HÉROS ORDINAIRES'],
        'ANCRER L’ADMINISTRATION',
      ],
      [
        'fiche',
        "PLAN D'ACTIONS",
        ['I TOUS HÉROS ORDINAIRES'],
        'FAVORISER LES INITIATIVES LOCALES',
      ],
      ['section', 'ENGAGEMENT DES PARTENAIRES', [], 'ENGAGEMENT'],
    ]);
    // Le bandeau de l'axe reste dans la fiche précédente, l'intertitre dans la sienne.
    expect(units[2].text).toContain('LES OUTILS');
  });

  it('reconnaît le rappel d’un axe à son numéro, même libellé autrement', () => {
    const units = cut([
      page(
        0,
        'Axe 2 : Mobilité',
        'Action 2.1 : Covoiturage',
        'AXE 2 – MOBILITÉ DURABLE ET DÉCARBONÉE',
        'Suite de la fiche.'
      ),
    ]);

    expect(units.map((unit) => unit.kind)).toEqual(['section', 'fiche']);
    expect(units[1].text).toContain('Suite de la fiche.');
  });

  it('ne fusionne jamais deux parties du document', () => {
    const units = cut(
      [page(0, 'DIAGNOSTIC', 'Court.', 'PLAN D’ACTIONS', 'Court aussi.')],
      { minTokens: 500 }
    );

    expect(units.map((unit) => unit.section)).toEqual([
      'DIAGNOSTIC',
      'PLAN D’ACTIONS',
    ]);
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
