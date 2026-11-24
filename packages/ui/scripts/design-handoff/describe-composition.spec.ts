import { describe, expect, it } from 'vitest';
import { describeComposition } from './describe-composition.ts';

const boardOf = (body: string): string => `<!doctype html>
<html><head><script src="./support.js"></script></head>
<body><x-dc><helmet><style>body{margin:0}</style></helmet>${body}</x-dc>
<script type="text/x-dc" data-dc-script>class Component extends DCLogic {}</script>
</body></html>`;

describe('describeComposition', () => {
  it('liste les composants avec leurs props, la mise en page et les textes, en arbre', () => {
    const composition = describeComposition(
      boardOf(`
        <div style="display: flex; flex-direction: column; gap: 24px">
          <h1>Mes plans</h1>
          <div style="display: flex; gap: 8px">
            <x-import component-from-global-scope="TeT.Badge" variant="success">Validé</x-import>
            <x-import component-from-global-scope="TeT.Button" variant="primary" icon="add-line">Créer un plan</x-import>
          </div>
        </div>`)
    );
    expect(composition).toBe(
      [
        '- colonne (gap 24px)',
        '  - h1 « Mes plans »',
        '  - ligne (gap 8px)',
        '    - TeT.Badge variant="success" « Validé »',
        '    - TeT.Button variant="primary" icon="add-line" « Créer un plan »',
      ].join('\n')
    );
  });

  it('range un composant imbriqué sous son parent', () => {
    expect(
      describeComposition(
        boardOf(`
          <x-import component-from-global-scope="TeT.Card">
            <x-import component-from-global-scope="TeT.Badge">Nouveau</x-import>
          </x-import>`)
      )
    ).toBe(['- TeT.Card', '  - TeT.Badge « Nouveau »'].join('\n'));
  });

  it('omet les blocs sans mise en page et sans texte, le style et les scripts', () => {
    expect(describeComposition(boardOf('<div><section></section></div>'))).toBe(
      ''
    );
  });

  it('abrège un texte long', () => {
    const longText = 'mot '.repeat(40);
    const [line] = describeComposition(boardOf(`<p>${longText}</p>`)).split(
      '\n'
    );
    expect(line?.endsWith('… »')).toBe(true);
  });
});
