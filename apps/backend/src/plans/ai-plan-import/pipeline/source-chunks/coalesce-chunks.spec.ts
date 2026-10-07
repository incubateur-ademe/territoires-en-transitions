import { describe, expect, it } from 'vitest';
import { coalesceChunks } from './coalesce-chunks';

describe('coalesceChunks', () => {
  it('regroupe des tranches adjacentes sous le plafond et remappe les actions', () => {
    const source = {
      chunks: ['a'.repeat(35), 'b'.repeat(35), 'c'.repeat(35), 'd'.repeat(35)],
      chunkIndexByAction: [0, 1, 1, 3],
    };

    const coalesced = coalesceChunks(source, 25);

    expect(coalesced.chunks).toEqual([
      `${'a'.repeat(35)}\n\n${'b'.repeat(35)}`,
      `${'c'.repeat(35)}\n\n${'d'.repeat(35)}`,
    ]);
    expect(coalesced.chunkIndexByAction).toEqual([0, 0, 0, 1]);
  });

  it('laisse tel quel ce qui tient déjà dans une fenêtre', () => {
    const source = { chunks: ['a', 'b'], chunkIndexByAction: [1] };

    expect(coalesceChunks(source, 1000)).toEqual({
      chunks: ['a\n\nb'],
      chunkIndexByAction: [0],
    });
  });
});
