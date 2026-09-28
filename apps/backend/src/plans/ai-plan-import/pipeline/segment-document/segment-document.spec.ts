import { describe, expect, it } from 'vitest';
import { buildDocument, buildPage } from '../document/document-page';
import { detectHeadings } from './detect-headings';
import { segmentDocument } from './segment-document';
import { renderUnit } from './render-unit';

describe('segmentDocument', () => {
  it('numérote les unités d’un PDF dans l’ordre, en sautant les pages vides', () => {
    const document = buildDocument('pdf', [
      buildPage(0, [{ text: 'Axe 1 : Bâtiments' }]),
      buildPage(1, []),
      buildPage(2, [
        { text: 'Action 1.1.1 : Isoler' },
        { text: 'Pilote : Service' },
      ]),
    ]);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 1000,
      overlapTokens: 0,
    });

    expect(units.map((unit) => unit.id)).toEqual(['u0001', 'u0002']);
    expect(units[1]).toMatchObject({ kind: 'fiche', pageStart: 2, pageEnd: 2 });
  });

  it('découpe un tableur par lignes entières, en-tête répété', () => {
    const rows = Array.from(
      { length: 30 },
      (_, i) => `Axe ${i % 3}\tAction ${i}\tDescription assez longue ${i}`
    );
    const document = buildDocument('xlsx', [
      buildPage(
        0,
        ['axe\ttitre\tdescription', ...rows].map((text) => ({ text })),
        { label: 'Actions' }
      ),
    ]);

    const units = segmentDocument(document, {
      minTokens: 0,
      maxTokens: 120,
      overlapTokens: 0,
    });

    expect(units.length).toBeGreaterThan(1);
    for (const unit of units) {
      expect(unit.kind).toBe('table');
      expect(unit.lines[0].text).toBe('axe\ttitre\tdescription');
      expect(unit.headingPath).toEqual(['Actions']);
    }
    const allRows = units.flatMap((unit) =>
      unit.lines.slice(1).map((line) => line.text)
    );
    expect(allRows).toEqual(rows);
  });
});

const body = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    text: `Un paragraphe de corps de texte normal, numéro ${i}.`,
    fontSize: 12,
  }));

describe('detectHeadings', () => {
  it('lit un titre en grande police réparti sur plusieurs lignes', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'ENGAGEMENT', fontSize: 70 },
        { text: 'DES PARTENAIRES', fontSize: 70 },
        ...body(5),
      ]),
    ]);

    expect(headings).toEqual([
      {
        pageIndex: 0,
        lineIndex: 0,
        match: expect.objectContaining({
          kind: 'section',
          title: 'ENGAGEMENT DES PARTENAIRES',
        }),
      },
    ]);
  });

  it('recolle le début du titre au-dessus du numéro de fiche', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'I. TOUS HÉROS ORDINAIRES', fontSize: 12 },
        { text: 'ANCRER L’ADMINISTRATION', fontSize: 20 },
        { text: '1 DANS L’ÉCO-RESPONSABILITÉ', fontSize: 40 },
        ...body(5),
      ]),
    ]);

    expect(headings.map(({ lineIndex, match }) => [lineIndex, match])).toEqual([
      [0, expect.objectContaining({ kind: 'axe', number: 'I' })],
      [
        1,
        expect.objectContaining({
          kind: 'numero',
          number: '1',
          title: 'ANCRER L’ADMINISTRATION DANS L’ÉCO-RESPONSABILITÉ',
        }),
      ],
    ]);
  });

  it('recolle un début de titre en un seul mot, ou sur deux lignes', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: 'APPROFONDIR', fontSize: 20 },
        { text: '1 LA CONNAISSANCE LOCALE', fontSize: 40 },
        ...body(3),
        { text: 'SE PRÉPARER AU CLIMAT', fontSize: 20 },
        { text: 'DE DEMAIN :', fontSize: 20 },
        { text: '2 LA VILLE VÉGÉTALE', fontSize: 40 },
        ...body(3),
      ]),
    ]);

    expect(
      headings.map(({ lineIndex, match }) => [lineIndex, match.title])
    ).toEqual([
      [0, 'APPROFONDIR LA CONNAISSANCE LOCALE'],
      [5, 'SE PRÉPARER AU CLIMAT DE DEMAIN : LA VILLE VÉGÉTALE'],
    ]);
  });

  it('écarte un numéro seul qui ne prolonge pas la suite des fiches', () => {
    const headings = detectHeadings([
      buildPage(0, [
        { text: '66 PLAN CLIMAT', fontSize: 40 },
        { text: '1 SOBRIÉTÉ ÉNERGÉTIQUE', fontSize: 40 },
        { text: '2 MOBILITÉ DOUCE', fontSize: 40 },
        { text: '40 GIGAWATTS ÉVITÉS', fontSize: 40 },
        ...body(8),
      ]),
    ]);

    expect(headings.map(({ match }) => match.number)).toEqual(['1', '2']);
  });

  it('ignore les lignes en toute petite police, comme les logos', () => {
    expect(
      detectHeadings([
        buildPage(0, [
          { text: 'LOGOTYPE TONS DIRECTS', fontSize: 2 },
          ...body(5),
        ]),
      ])
    ).toEqual([]);
  });

  it('tient une ligne en majuscules pour un grand titre quand sa police est plus grande', () => {
    const pages = [
      buildPage(0, [
        { text: 'RÉNOVER LE PATRIMOINE BÂTI', fontSize: 18 },
        { text: 'Un paragraphe de corps de texte normal.', fontSize: 10 },
        { text: 'Un autre paragraphe de corps de texte.', fontSize: 10 },
      ]),
    ];

    expect(detectHeadings(pages)).toEqual([
      {
        pageIndex: 0,
        lineIndex: 0,
        match: expect.objectContaining({ level: 1, confidence: 0.8 }),
      },
    ]);
  });
});

describe('renderUnit', () => {
  it('situe l’extrait et marque les changements de page', () => {
    const [unit] = segmentDocument(
      buildDocument('pdf', [
        buildPage(3, [{ text: 'Action 1.1.1 : Isoler' }, { text: 'Début.' }]),
        buildPage(4, [{ text: 'Suite.' }]),
      ]),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
    );

    expect(renderUnit(unit, { index: 1, count: 3 })).toBe(
      '[Extrait 2/3 · pages 4–5]\nAction 1.1.1 : Isoler\nDébut.\n[page 5]\nSuite.'
    );
  });

  it('nomme la partie du document avant le chemin des titres', () => {
    const units = segmentDocument(
      buildDocument('pdf', [
        buildPage(0, [
          { text: "PLAN D'ACTIONS" },
          { text: 'Axe 1 : Bâtiments' },
          { text: 'Action 1.1 : Isoler' },
        ]),
      ]),
      { minTokens: 0, maxTokens: 1000, overlapTokens: 0 }
    );

    expect(renderUnit(units[2], { index: 2, count: 3 })).toBe(
      "[Extrait 3/3 · page 1 · partie « PLAN D'ACTIONS » · 1 Bâtiments]\nAction 1.1 : Isoler"
    );
  });
});
