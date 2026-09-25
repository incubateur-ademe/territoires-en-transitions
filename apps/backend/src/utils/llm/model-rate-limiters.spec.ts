import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelRateLimiters } from './model-rate-limiters';

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

describe('ModelRateLimiters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fait attendre la requête de trop pour un même modèle', async () => {
    const limiters = new ModelRateLimiters(null, 2);
    await limiters.acquire('gpt-oss-120b', 10);
    await limiters.acquire('gpt-oss-120b', 10);

    const third = limiters.acquire('gpt-oss-120b', 10);
    expect(await settled(third)).toBe('pending');

    await vi.advanceTimersByTimeAsync(60_000);
    expect(await settled(third)).toBe('settled');
  });

  it('tient un quota séparé par modèle', async () => {
    const limiters = new ModelRateLimiters(null, 1);
    await limiters.acquire('gpt-oss-120b', 10);

    expect(await settled(limiters.acquire('lightonocr-2-1b', 10))).toBe(
      'settled'
    );
  });

  it('tient aussi le quota de tokens', async () => {
    const limiters = new ModelRateLimiters(100, 50);
    await limiters.acquire('m', 90);

    expect(await settled(limiters.acquire('m', 20))).toBe('pending');
  });

  it('pénalise seulement le modèle qui a reçu un 429', async () => {
    const limiters = new ModelRateLimiters(null, 10);
    limiters.penalize('gpt-oss-120b', 15_000);

    expect(await settled(limiters.acquire('gpt-oss-120b', 1))).toBe('pending');
    expect(await settled(limiters.acquire('ministral', 1))).toBe('settled');
  });

  it('laisse tout passer sans quota', async () => {
    const limiters = new ModelRateLimiters(null, null);
    await limiters.acquire('m', 1_000_000);

    expect(await settled(limiters.acquire('m', 1_000_000))).toBe('settled');
  });
});
