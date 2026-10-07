import { describe, expect, it } from 'vitest';
import { escapeLikePattern } from './like-pattern.utils';

describe('escapeLikePattern', () => {
  it('préfixe de \\ chaque caractère spécial de LIKE', () => {
    expect(escapeLikePattern('a%b_c\\d')).toBe('a\\%b\\_c\\\\d');
  });

  it('laisse intacte une valeur sans caractère spécial', () => {
    expect(escapeLikePattern('rapport-annuel.pdf')).toBe('rapport-annuel.pdf');
  });
});
