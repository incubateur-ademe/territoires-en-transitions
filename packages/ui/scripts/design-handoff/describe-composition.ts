import { JSDOM } from 'jsdom';
import { parseDeclarations } from './declarations.ts';
import { readableText } from './readable-text.ts';

const IGNORED_TAGS = new Set([
  'script',
  'style',
  'helmet',
  'link',
  'meta',
  'title',
  'head',
]);

const TEXT_TAGS = new Set([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'span',
  'li',
  'a',
  'label',
]);

const HIDDEN_ATTRIBUTES = new Set(['style', 'component-from-global-scope']);
const TEXT_LENGTH = 60;
const INDENT = '  ';

const propsOf = (element: Element): string =>
  [...element.attributes]
    .filter(({ name }) => !HIDDEN_ATTRIBUTES.has(name))
    .map(({ name, value }) => (value ? ` ${name}="${value}"` : ` ${name}`))
    .join('');

const ownTextOf = (element: Element): string =>
  readableText(
    [...element.childNodes]
      .filter((node) => node.nodeType === node.TEXT_NODE)
      .map((node) => node.textContent ?? '')
      .join(' '),
    TEXT_LENGTH
  );

const withText = (label: string, text: string): string =>
  text ? `${label} « ${text} »` : label;

const layoutOf = (element: Element): string | undefined => {
  const declarations = parseDeclarations(element.getAttribute('style') ?? '');
  const valueOf = (property: string): string | undefined =>
    declarations.find((declaration) => declaration.property === property)
      ?.value;
  const display = valueOf('display');
  const gap = valueOf('gap');
  const gapLabel = gap ? ` (gap ${gap})` : '';
  if (display === 'grid') return `grille${gapLabel}`;
  if (display === 'flex') {
    return `${
      valueOf('flex-direction')?.startsWith('column') ? 'colonne' : 'ligne'
    }${gapLabel}`;
  }
  return undefined;
};

const lineOf = (element: Element): string | undefined => {
  const tag = element.tagName.toLowerCase();
  if (tag === 'x-import') {
    const scope = element.getAttribute('component-from-global-scope') ?? tag;
    return withText(`${scope}${propsOf(element)}`, ownTextOf(element));
  }
  if (tag === 'dc-import') return `${tag}${propsOf(element)}`;
  if (TEXT_TAGS.has(tag)) {
    return withText(tag, readableText(element.textContent ?? '', TEXT_LENGTH));
  }
  return layoutOf(element);
};

const outline = (element: Element, depth: number): ReadonlyArray<string> => {
  if (IGNORED_TAGS.has(element.tagName.toLowerCase())) return [];
  const line = lineOf(element);
  const isText = TEXT_TAGS.has(element.tagName.toLowerCase());
  const children = isText
    ? []
    : [...element.children].flatMap((child) =>
        outline(child, line === undefined ? depth : depth + 1)
      );
  return line === undefined
    ? children
    : [`${INDENT.repeat(depth)}- ${line}`, ...children];
};

export const describeComposition = (html: string): string => {
  const dom = new JSDOM(html);
  try {
    return outline(dom.window.document.body, 0).join('\n');
  } finally {
    dom.window.close();
  }
};
