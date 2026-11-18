import { describe, expect, test } from 'vitest';
import { readBoundedText, retryDelaySeconds } from './github-repo.client';

const headers = (values: Record<string, string>) => new Headers(values);

describe('retryDelaySeconds', () => {
  const now = 1_000_000;

  test('suit Retry-After en premier, y compris pour une limite secondaire en 403', () => {
    expect(retryDelaySeconds(429, headers({ 'retry-after': '60' }), now)).toBe(
      60
    );
    expect(
      retryDelaySeconds(
        403,
        headers({ 'retry-after': '30', 'x-ratelimit-remaining': '12' }),
        now
      )
    ).toBe(30);
  });

  test('attend la remise à zéro du quota quand il est épuisé', () => {
    expect(
      retryDelaySeconds(
        403,
        headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1045' }),
        now
      )
    ).toBe(45);
  });

  test('attend une minute sans indication', () => {
    expect(retryDelaySeconds(429, headers({}), now)).toBe(60);
  });

  test('un 403 avec quota restant et sans Retry-After reste une erreur', () => {
    expect(
      retryDelaySeconds(403, headers({ 'x-ratelimit-remaining': '12' }), now)
    ).toBeNull();
    expect(retryDelaySeconds(500, headers({}), now)).toBeNull();
  });
});

describe('readBoundedText', () => {
  test('rend le texte sous la limite, accents compris', async () => {
    expect(await readBoundedText(new Response('été'), 10)).toBe('été');
  });

  test('compte les octets, pas les caractères, et abandonne au dépassement', async () => {
    // 6 caractères, 12 octets en UTF-8.
    expect(await readBoundedText(new Response('éééééé'), 10)).toBeNull();
    expect(await readBoundedText(new Response('éééééé'), 12)).toBe('éééééé');
  });
});
