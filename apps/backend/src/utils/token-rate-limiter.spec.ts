import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenRateLimiter } from './token-rate-limiter';

// Sous horloges factices : on laisse passer les microtâches, pas le temps.
const settled = async <T>(
  promise: Promise<T>
): Promise<'settled' | 'pending'> => {
  let state: 'settled' | 'pending' = 'pending';
  promise.then(() => {
    state = 'settled';
  });
  await vi.advanceTimersByTimeAsync(0);
  return state;
};

describe('TokenRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('laisse tout passer sans budget', async () => {
    const limiter = new TokenRateLimiter(null);

    await expect(limiter.acquire(1_000_000)).resolves.toBeTypeOf('function');
  });

  it('fait attendre la fin de la fenêtre glissante quand le budget est consommé', async () => {
    const limiter = new TokenRateLimiter(100);
    await limiter.acquire(60);
    await limiter.acquire(30);

    const third = limiter.acquire(30);
    expect(await settled(third)).toBe('pending');

    await vi.advanceTimersByTimeAsync(60_000);
    expect(await settled(third)).toBe('settled');
  });

  it('laisse passer seul un appel plus gros que le budget, fenêtre vide', async () => {
    const limiter = new TokenRateLimiter(100);

    await expect(limiter.acquire(500)).resolves.toBeTypeOf('function');
    expect(await settled(limiter.acquire(1))).toBe('pending');
  });

  it('corrige la réservation avec la consommation réelle', async () => {
    const limiter = new TokenRateLimiter(100);
    const settle = await limiter.acquire(90);
    settle(10);

    expect(await settled(limiter.acquire(80))).toBe('settled');
  });

  it('gèle les réservations pendant la pénalité', async () => {
    const limiter = new TokenRateLimiter(100);
    limiter.penalize(15_000);

    const next = limiter.acquire(1);
    expect(await settled(next)).toBe('pending');
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await settled(next)).toBe('settled');
  });

  it("abandonne l'attente quand le signal est levé", async () => {
    const limiter = new TokenRateLimiter(100);
    await limiter.acquire(100);
    const controller = new AbortController();

    const waiting = limiter.acquire(1, controller.signal);
    controller.abort(new Error('stop'));

    await expect(waiting).rejects.toThrow('stop');
  });
});
