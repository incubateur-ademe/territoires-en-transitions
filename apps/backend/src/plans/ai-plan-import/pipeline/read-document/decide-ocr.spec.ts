import { describe, expect, it } from 'vitest';
import { buildPage } from '../document/document-page';
import { decideOcr } from './decide-ocr';

const pageOf = (index: number, chars: number) =>
  buildPage(index, [{ text: 'x'.repeat(chars) }]);

describe('decideOcr', () => {
  it('ne désigne rien quand toutes les pages ont du texte', () => {
    expect(decideOcr([pageOf(0, 1500), pageOf(1, 2000)])).toEqual({
      kind: 'none',
    });
  });

  it('désigne les pages presque vides d’un PDF texte, sans en faire un scan', () => {
    expect(
      decideOcr([
        pageOf(0, 1500),
        pageOf(1, 1500),
        pageOf(2, 12),
        pageOf(3, 1500),
        pageOf(4, 0),
      ])
    ).toEqual({ kind: 'ocr', pageIndexes: [2, 4], fullScan: false });
  });

  it('reconnaît un document scanné de bout en bout', () => {
    expect(decideOcr([pageOf(0, 0), pageOf(1, 3)])).toEqual({
      kind: 'ocr',
      pageIndexes: [0, 1],
      fullScan: true,
    });
  });

  it('refuse un scan trop long plutôt que de le lire en partie', () => {
    const pages = Array.from({ length: 5 }, (_, index) => pageOf(index, 0));

    expect(decideOcr(pages, { minCharsPerPage: 200, maxOcrPages: 4 })).toEqual({
      kind: 'refuse',
      scannedPages: 5,
      maxOcrPages: 4,
    });
  });

  it('se passe d’OCR dans un PDF texte aux trop nombreuses pages photo', () => {
    const pages = [
      ...Array.from({ length: 5 }, (_, index) => pageOf(index, 0)),
      ...Array.from({ length: 20 }, (_, index) => pageOf(index + 5, 1500)),
    ];

    expect(decideOcr(pages, { minCharsPerPage: 200, maxOcrPages: 4 })).toEqual({
      kind: 'none',
    });
  });
});
