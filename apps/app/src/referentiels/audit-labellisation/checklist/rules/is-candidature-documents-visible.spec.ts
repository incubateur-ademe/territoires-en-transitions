import { describe, expect, it } from 'vitest';
import { isCandidatureDocumentsVisible } from './is-candidature-documents-visible';

describe('isCandidatureDocumentsVisible', () => {
  it('masque les documents de candidature à la première étoile', () => {
    expect(isCandidatureDocumentsVisible(1)).toBe(false);
  });

  it('affiche les documents de candidature dès la deuxième étoile', () => {
    expect(isCandidatureDocumentsVisible(2)).toBe(true);
  });
});
