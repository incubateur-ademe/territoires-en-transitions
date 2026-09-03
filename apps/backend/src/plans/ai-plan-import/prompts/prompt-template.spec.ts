import { describe, expect, it } from 'vitest';
import { definePrompt, generatePrompt } from './prompt-template';

describe('generatePrompt', () => {
  const prompt = definePrompt({
    template: 'Montant: {montant}, texte: {texte}',
    placeholders: { montant: '{montant}', texte: '{texte}' },
  });

  it('interpole chaque placeholder par sa valeur', () => {
    expect(generatePrompt(prompt, { montant: '1000', texte: 'plan' })).toBe(
      'Montant: 1000, texte: plan'
    );
  });

  it('insere les valeurs litteralement sans interpreter les motifs $ de remplacement', () => {
    expect(
      generatePrompt(prompt, { montant: '$100 $$ $& $1', texte: "$'" })
    ).toBe("Montant: $100 $$ $& $1, texte: $'");
  });
});
