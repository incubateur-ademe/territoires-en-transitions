import { expect, test } from 'vitest';
import { removeAccents } from './unaccent.utils';

test('Suppression des accents et autres diacritiques', () => {
  const result = removeAccents(
    'chaîne avec des lettres accentuées : à èê ô ù ç'
  );
  expect(result).toBe('chaine avec des lettres accentuees : a ee o u c');
});
