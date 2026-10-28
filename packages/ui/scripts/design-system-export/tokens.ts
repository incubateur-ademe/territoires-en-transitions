/*
 * Construction pure du `tokens.json` (et du `tokens.css` compilé) du design
 * system publié dans Claude, à partir des sources du repo : `@tet/design-tokens`,
 * le thème Tailwind résolu, l'échelle des primitives de layout et les styles de
 * `global.css`. Aucune valeur n'est saisie ici : seules les notes d'usage le sont
 * (`usages.ts`).
 */

export type Token = Readonly<{ name: string; value: string; usage: string }>;

export type TokenFamily = Readonly<{
  note?: string;
  tokens: ReadonlyArray<Token>;
}>;

export type FontFace = Readonly<{
  family: string;
  file: string;
  weight: string;
  style: 'normal' | 'italic';
}>;

export type TypeStyle = Readonly<{
  name: string;
  fontSize: string;
  lineHeight?: string;
  fontWeight?: number;
  usage: string;
}>;

export type TypeGroup = Readonly<{
  name: string;
  family: string;
  styles: ReadonlyArray<TypeStyle>;
}>;

export type TokensMeta = Readonly<{
  source: 'github';
  repo: string;
  ref: string;
  package: string;
  paths: Readonly<Record<string, ReadonlyArray<string>>>;
  synced: string;
}>;

export type TokensJson = Readonly<{
  name: string;
  version: 1;
  meta: TokensMeta;
  color: Readonly<{
    themes: ReadonlyArray<Readonly<{ id: string; name: string }>>;
    tokens: ReadonlyArray<Token>;
  }>;
  type: Readonly<{
    fonts: ReadonlyArray<FontFace>;
    families: Readonly<Record<string, string>>;
    groups: ReadonlyArray<TypeGroup>;
  }>;
  spacing: TokenFamily;
  radius: TokenFamily;
  shadow: TokenFamily;
  maxWidth: TokenFamily;
  zIndex: TokenFamily;
}>;

/** Couleurs telles que déclarées dans `designTokens.colors`. */
export type ColorSource = Readonly<
  Record<string, string | Readonly<Record<string, string>>>
>;

/** Déclarations CSS d'un sélecteur de `global.css` (`h1`, `.paragraphe-14`…). */
export type CssDeclarations = Readonly<Record<string, string>>;

export type TokensSource = Readonly<{
  name: string;
  meta: TokensMeta;
  colors: ColorSource;
  /** Couleurs de `global.css` sans token Tailwind (texte courant). */
  extraColors: ReadonlyArray<Readonly<{ name: string; value: string }>>;
  fontStack: ReadonlyArray<string>;
  fontFaces: ReadonlyArray<FontFace>;
  fontSize: Readonly<Record<string, string>>;
  headings: Readonly<Record<string, CssDeclarations>>;
  paragraphes: Readonly<Record<string, CssDeclarations>>;
  /** Échelle sémantique des primitives (`md` → pas Tailwind `4`). */
  spacingScale: Readonly<Record<string, string>>;
  /** Thème Tailwind résolu : pas d'espacement → longueur. */
  tailwindSpacing: Readonly<Record<string, string>>;
  radius: Readonly<Record<string, string>>;
  boxShadow: Readonly<Record<string, string>>;
  maxWidth: Readonly<Record<string, string>>;
  zIndex: Readonly<Record<string, string>>;
  usages: Readonly<Record<string, string>>;
}>;

const DEFAULT_KEY = 'DEFAULT';

/**
 * Aplatit `{ primary: { 1: '#…', DEFAULT: '#…' } }` en `primary-1`, `primary`.
 * Un `DEFAULT` égal à une teinte de sa gamme devient un alias de cette teinte.
 */
export const flattenColors = (
  colors: ColorSource
): ReadonlyArray<Readonly<{ name: string; value: string }>> =>
  Object.entries(colors).flatMap(([group, value]) => {
    if (typeof value === 'string') {
      return [{ name: group, value: normalizeColor(value) }];
    }
    const shades = Object.entries(value).filter(([key]) => key !== DEFAULT_KEY);
    const defaultValue = value[DEFAULT_KEY];
    const aliasOf = shades.find(
      ([, shade]) =>
        defaultValue !== undefined &&
        normalizeColor(shade) === normalizeColor(defaultValue)
    );
    return [
      ...shades.map(([key, shade]) => ({
        name: `${group}-${key}`,
        value: normalizeColor(shade),
      })),
      ...(defaultValue === undefined
        ? []
        : [
            {
              name: group,
              value: aliasOf
                ? `{${group}-${aliasOf[0]}}`
                : normalizeColor(defaultValue),
            },
          ]),
    ];
  });

/** Hex en minuscules, `rgba(26, 42, 130, 0.5)` sans espaces superflus. */
export const normalizeColor = (value: string): string =>
  value.startsWith('#')
    ? value.toLowerCase()
    : value.replace(/\s*,\s*/g, ', ').trim();

const withUsage =
  (usages: TokensSource['usages'], fallback: (name: string) => string) =>
  (token: Readonly<{ name: string; value: string }>): Token => ({
    ...token,
    usage: usages[token.name] ?? fallback(token.name),
  });

/** Note d'usage par défaut d'une teinte : celle de sa gamme (`primary-3` → `primary`). */
const groupUsage =
  (usages: TokensSource['usages']) =>
  (name: string): string =>
    usages[name.replace(/-[^-]+$/, '')] ?? '';

const familyTokens = (
  prefix: string,
  values: Readonly<Record<string, string>>,
  usages: TokensSource['usages']
): ReadonlyArray<Token> =>
  Object.entries(values).map(([key, value]) => {
    const name = key === DEFAULT_KEY ? prefix : `${prefix}-${key}`;
    return { name, value, usage: usages[name] ?? usages[prefix] ?? '' };
  });

const toStyle =
  (usages: TokensSource['usages'], fontWeight?: number) =>
  ([name, declarations]: [string, CssDeclarations]): TypeStyle => ({
    name,
    fontSize: declarations['font-size'] ?? '',
    ...(declarations['line-height']
      ? { lineHeight: declarations['line-height'] }
      : {}),
    ...(fontWeight === undefined
      ? declarations['font-weight']
        ? { fontWeight: Number(declarations['font-weight']) }
        : {}
      : { fontWeight }),
    usage: usages[name] ?? '',
  });

export const buildTokens = (source: TokensSource): TokensJson => {
  const { usages } = source;
  const colorTokens = [
    ...flattenColors(source.colors),
    ...source.extraColors.map((color) => ({
      ...color,
      value: normalizeColor(color.value),
    })),
  ].map(withUsage(usages, groupUsage(usages)));

  return {
    name: source.name,
    version: 1,
    meta: source.meta,
    color: {
      themes: [{ id: 'light', name: 'Clair' }],
      tokens: colorTokens,
    },
    type: {
      fonts: source.fontFaces,
      families: { sans: source.fontStack.join(', ') },
      groups: [
        {
          name: 'Titres',
          family: 'sans',
          styles: Object.entries(source.headings).map(toStyle(usages, 700)),
        },
        {
          name: 'Paragraphes',
          family: 'sans',
          styles: Object.entries(source.paragraphes).map(toStyle(usages, 400)),
        },
        {
          name: 'Échelle de texte',
          family: 'sans',
          styles: Object.entries(source.fontSize).map(([key, fontSize]) => ({
            name: `text-${key}`,
            fontSize,
            usage: usages[`text-${key}`] ?? usages['text'] ?? '',
          })),
        },
      ],
    },
    spacing: {
      note: usages['spacing'],
      tokens: Object.entries(source.spacingScale).map(([key, step]) => ({
        name: `space-${key}`,
        value: source.tailwindSpacing[step] ?? step,
        usage: usages[`space-${key}`] ?? '',
      })),
    },
    radius: { tokens: familyTokens('radius', source.radius, usages) },
    shadow: { tokens: familyTokens('shadow', source.boxShadow, usages) },
    maxWidth: { tokens: familyTokens('max-w', source.maxWidth, usages) },
    zIndex: { tokens: familyTokens('z', source.zIndex, usages) },
  };
};

const cssValue = (value: string): string =>
  value.replace(/^\{(.+)\}$/, 'var(--$1)');

const declarationBlock = (
  selector: string,
  declarations: ReadonlyArray<readonly [string, string]>
): string =>
  [
    `${selector} {`,
    ...declarations.map(([property, value]) => `  ${property}: ${value};`),
    '}',
  ].join('\n');

/** `tokens.css` tel que la page du design system le compile (cf. format.md). */
export const buildTokensCss = (tokens: TokensJson): string => {
  const firstTheme = tokens.color.themes[0]?.id ?? 'light';
  const customProperty = (token: Token) =>
    [`--${token.name}`, cssValue(token.value)] as const;

  const fontFaces = tokens.type.fonts.map((font) =>
    declarationBlock('@font-face', [
      ['font-family', `"${font.family}"`],
      ['src', `url("${font.file}") format("woff2")`],
      ['font-weight', font.weight],
      ['font-style', font.style],
      ['font-display', 'swap'],
    ])
  );

  const typeClasses = tokens.type.groups.flatMap((group) =>
    group.styles.map((style) =>
      declarationBlock(`.${style.name}`, [
        ['font-family', `var(--font-${group.family})`],
        ['font-size', style.fontSize],
        ...(style.lineHeight
          ? [['line-height', style.lineHeight] as const]
          : []),
        ...(style.fontWeight === undefined
          ? []
          : [['font-weight', String(style.fontWeight)] as const]),
      ])
    )
  );

  return [
    `/* ${tokens.name} — generated from tokens.json */`,
    declarationBlock(`:root, [data-theme="${firstTheme}"]`, [
      ...tokens.color.tokens.map(customProperty),
      ...tokens.shadow.tokens.map(customProperty),
    ]),
    declarationBlock(':root', [
      ...tokens.spacing.tokens.map(customProperty),
      ...tokens.radius.tokens.map(customProperty),
      ...tokens.maxWidth.tokens.map(customProperty),
      ...tokens.zIndex.tokens.map(customProperty),
      ...Object.entries(tokens.type.families).map(
        ([key, stack]) => [`--font-${key}`, stack] as const
      ),
    ]),
    ...typeClasses,
    ...fontFaces,
    '',
  ].join('\n\n');
};
