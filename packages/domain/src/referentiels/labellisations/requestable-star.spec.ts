import { Etoile } from './labellisation-etoile.enum.schema';
import { getMaxRequestableStar } from './requestable-star';

describe('getMaxRequestableStar', () => {
  it.each<[number, Etoile]>([
    [-0.1, 1],
    [0, 1],
    [0.34, 1],
    [0.35, 2],
    [0.49, 2],
    [0.5, 3],
    [0.64, 3],
    [0.65, 4],
    [0.6812, 4],
    [0.74, 4],
    [0.75, 5],
    [1, 5],
  ])('score réalisé %d → étoile %d max', (scoreFait, expected) => {
    expect(getMaxRequestableStar(scoreFait)).toBe(expected);
  });

  it('est monotone croissant avec le score', () => {
    const scores = Array.from({ length: 101 }, (_, i) => i / 100);
    scores.forEach((score, index) => {
      if (index === 0) return;
      expect(getMaxRequestableStar(score)).toBeGreaterThanOrEqual(
        getMaxRequestableStar(scores[index - 1])
      );
    });
  });
});
