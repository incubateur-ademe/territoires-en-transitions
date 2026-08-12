import { describe, expect, test } from 'vitest';
import { withPageReset } from './filters';

describe('withPageReset', () => {
  test('remet la pagination à la première page quand un filtre change', () => {
    expect(withPageReset({ types: ['reponse'] })).toEqual({
      types: ['reponse'],
      page: null,
    });
  });

  test('ne touche pas la pagination quand seule la page change', () => {
    expect(withPageReset({ page: 3 })).toEqual({ page: 3 });
  });

  test('laisse gagner la page explicite du patch', () => {
    expect(withPageReset({ page: 2, types: ['justification'] })).toEqual({
      page: 2,
      types: ['justification'],
    });
  });

  test('ne réinitialise rien sur un patch vide', () => {
    expect(withPageReset({})).toEqual({});
  });
});
