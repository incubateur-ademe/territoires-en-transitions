import { expect, test } from 'vitest';
import { unaccent } from './unaccent.utils';

test('Suppression des accents et autres diacritiques', () => {
  const result = unaccent('chaîne avec des lettres accentuées : à èê ô ù ç');
  expect(result).toBe('chaine avec des lettres accentuees : a ee o u c');
});
