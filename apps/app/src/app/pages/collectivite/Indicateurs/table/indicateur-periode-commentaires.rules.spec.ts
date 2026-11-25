import { describe, expect, it } from 'vitest';
import { countCommentaires } from './indicateur-periode-commentaires.rules';

describe('countCommentaires', () => {
  it.each([
    [{ resultat: '', objectif: '' }, 0],
    [{ resultat: 'a', objectif: '' }, 1],
    [{ resultat: 'a', objectif: 'b' }, 2],
  ])('compte les commentaires renseignés de %o', (commentaires, expected) => {
    expect(countCommentaires(commentaires)).toBe(expected);
  });
});
