import { describe, expect, it } from 'vitest';
import { chunkedMap } from './chunked-map.utils';

describe('chunkedMap', () => {
  it('preserves input order in the output', async () => {
    const result = await chunkedMap({
      items: [1, 2, 3, 4, 5],
      chunkSize: 2,
      fn: async (n) => n * 10,
    });
    expect(result).toEqual([10, 20, 30, 40, 50]);
  });

  it('processes chunks sequentially but items within a chunk in parallel', async () => {
    const startTimes: number[] = [];
    await chunkedMap({
      items: [1, 2, 3, 4],
      chunkSize: 2,
      fn: async (n) => {
        startTimes.push(Date.now());
        await new Promise((resolve) => setTimeout(resolve, 20));
        return n;
      },
    });
    // items 1 et 2 demarrent quasi-simultanement, puis 3 et 4 apres le delai
    expect(startTimes[1] - startTimes[0]).toBeLessThan(10);
    expect(startTimes[2] - startTimes[0]).toBeGreaterThanOrEqual(15);
    expect(startTimes[3] - startTimes[2]).toBeLessThan(10);
  });

  it('returns an empty array when items is empty', async () => {
    const result = await chunkedMap({
      items: [],
      chunkSize: 10,
      fn: async (n: number) => n,
    });
    expect(result).toEqual([]);
  });

  it('handles a chunk size larger than the input', async () => {
    const result = await chunkedMap({
      items: [1, 2, 3],
      chunkSize: 100,
      fn: async (n) => n * 2,
    });
    expect(result).toEqual([2, 4, 6]);
  });
});
