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

describe('detectHeadings', () => {
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
});
