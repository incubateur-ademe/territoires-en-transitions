import { describe, expect, it } from 'vitest';
import { parseDeclarations, parseStyleRules } from './declarations.ts';

describe('parseDeclarations', () => {
  it('lit les paires propriété/valeur et met la propriété en minuscules', () => {
    expect(parseDeclarations('Display: flex; gap: 16px')).toEqual([
      { property: 'display', value: 'flex' },
      { property: 'gap', value: '16px' },
    ]);
  });

  it('ne coupe pas un point-virgule placé dans des parenthèses', () => {
    expect(
      parseDeclarations('background: url(data:image/png;base64,AAA); gap: 8px')
    ).toEqual([
      { property: 'background', value: 'url(data:image/png;base64,AAA)' },
      { property: 'gap', value: '8px' },
    ]);
  });

  it('ignore les fragments sans valeur', () => {
    expect(parseDeclarations(';color:;: red;gap: 4px;')).toEqual([
      { property: 'gap', value: '4px' },
    ]);
  });
});

describe('parseStyleRules', () => {
  it('rend le sélecteur et les déclarations de chaque règle', () => {
    expect(parseStyleRules('body{margin:0}\na:hover { color: #333 }')).toEqual([
      {
        selector: 'body',
        declarations: [{ property: 'margin', value: '0' }],
      },
      {
        selector: 'a:hover',
        declarations: [{ property: 'color', value: '#333' }],
      },
    ]);
  });
});
