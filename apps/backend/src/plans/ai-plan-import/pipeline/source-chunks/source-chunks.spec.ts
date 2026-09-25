import { describe, expect, it } from 'vitest';
import { groupByChunk, wholeDocument } from './source-chunks';

describe('groupByChunk', () => {
  it("regroupe les éléments par tranche de leur action, dans l'ordre des tranches", () => {
    const source = {
      chunks: ['tranche 0', 'tranche 1'],
      chunkIndexByAction: [1, 0, 1],
    };

    const groups = groupByChunk([0, 1, 2], (index) => index, source);

    expect(groups).toEqual([
      { text: 'tranche 0', items: [1] },
      { text: 'tranche 1', items: [0, 2] },
    ]);
  });

  it('rattache tout au document entier quand il tient en une tranche', () => {
    const groups = groupByChunk(
      ['a', 'b'],
      (item) => (item === 'a' ? 0 : 1),
      wholeDocument('document', 2)
    );

    expect(groups).toEqual([{ text: 'document', items: ['a', 'b'] }]);
  });
});
