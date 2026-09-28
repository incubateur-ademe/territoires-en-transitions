import { describe, expect, it } from 'vitest';
import { textToRichText } from './text-to-rich-text';

describe('textToRichText', () => {
  it('fait une liste des lignes à puces, entre les paragraphes', () => {
    expect(
      textToRichText(
        'Renforcer l’action de la métropole.\n- 75 % : score visé en 2030\n- -40 % de consommations <patrimoine>'
      )
    ).toBe(
      '<p>Renforcer l’action de la métropole.</p><ul><li>75 % : score visé en 2030</li><li>-40 % de consommations &lt;patrimoine&gt;</li></ul>'
    );
  });

  it('laisse un texte sans puce tel quel', () => {
    expect(textToRichText('Un objectif.\nUne précision.')).toBe(
      'Un objectif.\nUne précision.'
    );
  });
});
