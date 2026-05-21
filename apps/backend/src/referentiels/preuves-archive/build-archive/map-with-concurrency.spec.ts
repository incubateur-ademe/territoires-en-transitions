import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './map-with-concurrency';

const tick = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('mapWithConcurrency', () => {
  it('rend les résultats dans l’ordre des items malgré des durées variables', async () => {
    const results = await mapWithConcurrency(
      [30, 10, 20],
      2,
      async (ms) => {
        await tick(ms);
        return ms * 2;
      }
    );
    expect(results).toEqual([60, 20, 40]);
  });

  it('ne dépasse jamais la concurrence demandée', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await tick(5);
      inFlight -= 1;
    });

    expect(maxInFlight).toBe(2);
  });

  it('reporte le nombre cumulé de tâches terminées', async () => {
    const completed: number[] = [];

    await mapWithConcurrency(
      [1, 2, 3],
      3,
      async () => undefined,
      (count) => completed.push(count)
    );

    expect(completed).toEqual([1, 2, 3]);
  });

  it('retourne un tableau vide pour une liste vide sans lancer de worker', async () => {
    let called = false;
    const results = await mapWithConcurrency([], 4, async () => {
      called = true;
      return 1;
    });
    expect(results).toEqual([]);
    expect(called).toBe(false);
  });
});
