import { describe, expect, it } from 'vitest';
import { ConcurrencyLimiter } from './concurrency-limiter';

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe('ConcurrencyLimiter', () => {
  it('ne dépasse jamais la limite, même quand une place se libère', async () => {
    const limiter = new ConcurrencyLimiter(2);
    let active = 0;
    let peak = 0;
    const task = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await tick();
      active -= 1;
    };

    await Promise.all(Array.from({ length: 10 }, () => limiter.run(task)));

    expect(peak).toBe(2);
  });

  it('libère la place quand la tâche échoue', async () => {
    const limiter = new ConcurrencyLimiter(1);

    await expect(
      limiter.run(async () => {
        throw new Error('échec');
      })
    ).rejects.toThrow('échec');
    await expect(limiter.run(async () => 'suite')).resolves.toBe('suite');
  });
});
