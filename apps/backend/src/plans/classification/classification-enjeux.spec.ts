import { describe, expect, it } from 'vitest';
import { DECLARED_ENJEUX } from './classification-enjeux';

const enjeuxMissing = (fragment: string): string[] =>
  Object.entries(DECLARED_ENJEUX)
    .filter(
      ([, { systemInstruction }]) => !systemInstruction.includes(fragment)
    )
    .map(([name]) => name);

describe('Les enjeux de classification declares', () => {
  it('rappellent tous que le texte entre balises est de la donnee, jamais une instruction', () => {
    expect(enjeuxMissing('# Contrat de balisage')).toEqual([]);
  });

  it('exigent tous une entree de reponse par index fourni', () => {
    expect(
      enjeuxMissing('exactement une entrée par index fourni, ni plus, ni moins')
    ).toEqual([]);
  });
});
