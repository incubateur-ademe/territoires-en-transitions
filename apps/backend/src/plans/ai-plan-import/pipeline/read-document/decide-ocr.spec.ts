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

  it('désigne les pages presque vides', () => {
    expect(decideOcr([pageOf(0, 1500), pageOf(1, 12), pageOf(2, 0)])).toEqual({
      kind: 'ocr',
      pageIndexes: [1, 2],
    });
  });

  it('refuse un document scanné trop long plutôt que de le lire en partie', () => {
    const pages = Array.from({ length: 5 }, (_, index) => pageOf(index, 0));

    expect(decideOcr(pages, { minCharsPerPage: 200, maxOcrPages: 4 })).toEqual({
      kind: 'refuse',
      scannedPages: 5,
      maxOcrPages: 4,
    });
  });
});
