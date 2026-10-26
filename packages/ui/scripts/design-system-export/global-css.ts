import postcss, { AtRule, Rule } from 'postcss';
import type { CssDeclarations, FontFace } from './tokens';

/** Ce que le design system reprend de `global.css`. */
export type GlobalCssStyles = Readonly<{
  headings: Readonly<Record<string, CssDeclarations>>;
  paragraphes: Readonly<Record<string, CssDeclarations>>;
  bodyColor: string | undefined;
  fontFaces: ReadonlyArray<FontFace>;
}>;

const HEADING = /^h[1-6]$/;
const PARAGRAPHE_SIZE = /^\.paragraphe-(\d+)$/;

const declarationsOf = (node: Rule | AtRule): CssDeclarations =>
  Object.fromEntries(
    (node.nodes ?? []).flatMap((child) =>
      child.type === 'decl' ? [[child.prop, child.value] as const] : []
    )
  );

type AncestorNode = Readonly<{ type: string; name?: string; parent?: unknown }>;

const isInsideMedia = (rule: Rule): boolean => {
  const walk = (node: AncestorNode | undefined): boolean =>
    node === undefined
      ? false
      : node.type === 'atrule' && node.name === 'media'
      ? true
      : walk(node.parent as AncestorNode | undefined);
  return walk(rule.parent as AncestorNode | undefined);
};

/** Fusionne les déclarations par sélecteur, dans l'ordre du fichier. */
const collectRules = (
  rules: ReadonlyArray<Rule>,
  keyOf: (selector: string) => string | undefined
): Readonly<Record<string, CssDeclarations>> =>
  rules.reduce<Readonly<Record<string, CssDeclarations>>>(
    (accumulator, rule) => {
      const keys = rule.selectors.flatMap((selector) => {
        const key = keyOf(selector.trim());
        return key ? [key] : [];
      });
      const declarations = declarationsOf(rule);
      return keys.reduce(
        (merged, key) => ({
          ...merged,
          [key]: { ...merged[key], ...declarations },
        }),
        accumulator
      );
    },
    {}
  );

/** `url('./assets/fonts/Marianne-Light.woff2') format('woff2')` → `Marianne-Light.woff2`. */
const woff2FileName = (src: string): string | undefined =>
  /url\(['"]?[^'")]*\/([^/'")]+\.woff2)['"]?\)/.exec(src)?.[1];

export const parseGlobalCss = (css: string): GlobalCssStyles => {
  const root = postcss.parse(css);
  const rules: Rule[] = [];
  const fontFaceRules: AtRule[] = [];
  root.walkRules((rule) => {
    if (!isInsideMedia(rule)) rules.push(rule);
  });
  root.walkAtRules('font-face', (atRule) => {
    fontFaceRules.push(atRule);
  });

  const headings = collectRules(rules, (selector) =>
    HEADING.test(selector) ? selector : undefined
  );
  const paragraphes = collectRules(rules, (selector) => {
    const size = PARAGRAPHE_SIZE.exec(selector)?.[1];
    return size ? `paragraphe-${size}` : undefined;
  });
  const body = collectRules(rules, (selector) =>
    selector === 'body' ? 'body' : undefined
  );

  const fontFaces = fontFaceRules.flatMap((atRule): FontFace[] => {
    const declarations = declarationsOf(atRule);
    const file = woff2FileName(declarations['src'] ?? '');
    const family = declarations['font-family']?.replace(/['"]/g, '');
    return file && family
      ? [
          {
            family,
            file: `fonts/${file}`,
            weight: declarations['font-weight'] ?? '400',
            style:
              declarations['font-style'] === 'italic' ? 'italic' : 'normal',
          },
        ]
      : [];
  });

  return {
    headings,
    paragraphes,
    bodyColor: body['body']?.['color'],
    fontFaces,
  };
};
