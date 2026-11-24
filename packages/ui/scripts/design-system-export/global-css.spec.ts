import { describe, expect, it } from 'vitest';
import { parseGlobalCss } from './global-css';

const css = `
@font-face {
  font-family: 'Marianne';
  src: url('./assets/fonts/Marianne-Bold.woff2') format('woff2'),
    url('./assets/fonts/Marianne-Bold.woff') format('woff');
  font-weight: 700;
  font-style: italic;
}
@layer base {
  body { color: #3a3a3a; }
  h1, h2 { font-weight: 700; }
  h1 { font-size: 2.5rem; line-height: 3rem; }
  @media (max-width: 768px) {
    h1 { font-size: 2rem; }
  }
}
@layer components {
  .paragraphe-14, .paragraphe-14 > p { font-size: 14px; line-height: 22px; }
}
`;

describe('parseGlobalCss', () => {
  const styles = parseGlobalCss(css);

  it('fusionne les règles des titres hors media queries', () => {
    expect(styles.headings['h1']).toEqual({
      'font-weight': '700',
      'font-size': '2.5rem',
      'line-height': '3rem',
    });
    expect(styles.headings['h2']).toEqual({ 'font-weight': '700' });
  });

  it('lit les classes de paragraphe et la couleur du texte courant', () => {
    expect(styles.paragraphes['paragraphe-14']).toEqual({
      'font-size': '14px',
      'line-height': '22px',
    });
    expect(styles.bodyColor).toBe('#3a3a3a');
  });

  it('retient le fichier woff2 de chaque @font-face', () => {
    expect(styles.fontFaces).toEqual([
      {
        family: 'Marianne',
        file: 'fonts/Marianne-Bold.woff2',
        weight: '700',
        style: 'italic',
      },
    ]);
  });
});
