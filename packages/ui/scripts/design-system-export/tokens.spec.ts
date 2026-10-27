import { describe, expect, it } from 'vitest';
import {
  buildTokens,
  buildTokensCss,
  flattenColors,
  normalizeColor,
  TokensSource,
} from './tokens';

const source: TokensSource = {
  name: 'Test',
  meta: {
    source: 'github',
    repo: 'org/repo',
    ref: 'main@abc1234',
    package: 'packages/ui',
    paths: {},
    synced: '2026-10-26',
  },
  colors: {
    bf500: '#000091',
    primary: { 1: '#F4F5FD', DEFAULT: '#6A6AF4', 7: '#6A6AF4' },
    overlay: 'rgba(26,42,130,0.5)',
  },
  extraColors: [{ name: 'text-body', value: '#3A3A3A' }],
  fontStack: ['Marianne', 'arial', 'sans-serif'],
  fontFaces: [
    {
      family: 'Marianne',
      file: 'fonts/Marianne-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  fontSize: { sm: '0.875rem' },
  headings: {
    h1: { 'font-weight': '700', 'font-size': '2.5rem', 'line-height': '3rem' },
  },
  paragraphes: {
    'paragraphe-14': { 'font-size': '14px', 'line-height': '22px' },
  },
  spacingScale: { none: '0', md: '4' },
  tailwindSpacing: { '0': '0px', '4': '1rem' },
  radius: { DEFAULT: '0.25rem', lg: '0.5rem' },
  boxShadow: { card: '2px 2px 10px 0 rgba(233, 233, 233, 0.9)' },
  maxWidth: { '8xl': '90rem' },
  zIndex: { modal: '1000' },
  usages: { primary: 'Marque.', 'primary-1': 'Fond.', 'radius-lg': 'Cartes.' },
};

describe('normalizeColor', () => {
  it('met les hex en minuscules et normalise les rgba', () => {
    expect(normalizeColor('#6A6AF4')).toBe('#6a6af4');
    expect(normalizeColor('rgba(26,42,130 , 0.5)')).toBe(
      'rgba(26, 42, 130, 0.5)'
    );
  });
});

describe('flattenColors', () => {
  it('aplatit les gammes et fait du DEFAULT un alias de la teinte égale', () => {
    expect(flattenColors(source.colors)).toEqual([
      { name: 'bf500', value: '#000091' },
      { name: 'primary-1', value: '#f4f5fd' },
      { name: 'primary-7', value: '#6a6af4' },
      { name: 'primary', value: '{primary-7}' },
      { name: 'overlay', value: 'rgba(26, 42, 130, 0.5)' },
    ]);
  });

  it("garde la valeur d'un DEFAULT sans teinte égale", () => {
    expect(
      flattenColors({ accent: { 1: '#111111', DEFAULT: '#222222' } })
    ).toEqual([
      { name: 'accent-1', value: '#111111' },
      { name: 'accent', value: '#222222' },
    ]);
  });
});

describe('buildTokens', () => {
  const tokens = buildTokens(source);

  it('reprend les notes d’usage, celle de la gamme par défaut', () => {
    const usage = (name: string) =>
      tokens.color.tokens.find((token) => token.name === name)?.usage;
    expect(usage('primary-1')).toBe('Fond.');
    expect(usage('primary-7')).toBe('Marque.');
  });

  it("traduit l'échelle sémantique en longueurs Tailwind", () => {
    expect(
      tokens.spacing.tokens.map(({ name, value }) => [name, value])
    ).toEqual([
      ['space-none', '0px'],
      ['space-md', '1rem'],
    ]);
  });

  it('nomme le DEFAULT d’une famille du nom de la famille', () => {
    expect(tokens.radius.tokens.map(({ name }) => name)).toEqual([
      'radius',
      'radius-lg',
    ]);
  });

  it('range titres, paragraphes et échelle de texte en groupes typographiques', () => {
    expect(
      tokens.type.groups.map((group) => group.styles.map((style) => style.name))
    ).toEqual([['h1'], ['paragraphe-14'], ['text-sm']]);
    expect(tokens.type.groups[0]?.styles[0]).toMatchObject({
      fontSize: '2.5rem',
      lineHeight: '3rem',
      fontWeight: 700,
    });
  });
});

describe('buildTokensCss', () => {
  const css = buildTokensCss(buildTokens(source));

  it('commence par la ligne qui le désigne comme généré', () => {
    expect(css.split('\n')[0]).toBe('/* Test — generated from tokens.json */');
  });

  it('déclare couleurs, alias et longueurs en propriétés personnalisées', () => {
    expect(css).toContain('--primary: var(--primary-7);');
    expect(css).toContain('--space-md: 1rem;');
    expect(css).toContain('--font-sans: Marianne, arial, sans-serif;');
  });

  it('génère une classe par style et un @font-face par police', () => {
    expect(css).toContain('.h1 {');
    expect(css).toContain(
      'src: url("fonts/Marianne-Bold.woff2") format("woff2");'
    );
  });
});
