import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TimeoutError, withTimeout } from 'es-toolkit';
import { JSDOM } from 'jsdom';
import mammoth from 'mammoth';
import { DocumentLinksRules } from '../document/document-links.rules';
import {
  buildPage,
  DocumentBlock,
  DocumentLink,
  DocumentLocation,
  DocumentPage,
  DocumentTableCell,
  PageLine,
} from '../document/document-page';

const DOCX_TIMEOUT_MS = 30_000;

// Word nomme ses titres selon la langue de l'interface : mammoth connaît les
// anglais, on lui donne les français.
const STYLE_MAP = [1, 2, 3, 4].flatMap((level) => [
  `p[style-name='Titre ${level}'] => h${level}:fresh`,
  `p[style-name='Heading ${level}'] => h${level}:fresh`,
]);

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
};

export type ReadDocxError = { kind: 'parse_failed' } | { kind: 'timeout' };

/**
 * Un document Word n'a pas de pages : une « page » par titre de niveau 1,
 * et les titres rendus en Markdown (`## …`), que la détection de titres
 * reconnaît tels quels. Les tableaux gardent une ligne par rangée.
 */
export const readDocx = async (
  buffer: Buffer
): Promise<
  Result<{ pages: DocumentPage[]; blocks: DocumentBlock[] }, ReadDocxError>
> => {
  try {
    const { value: html } = await withTimeout(
      () => mammoth.convertToHtml({ buffer }, { styleMap: STYLE_MAP }),
      DOCX_TIMEOUT_MS
    );
    return success({
      pages: toPages(htmlToLines(html)),
      blocks: readBlocks(html),
    });
  } catch (error) {
    if (error instanceof TimeoutError) {
      return failure({ kind: 'timeout' });
    }
    return failure({ kind: 'parse_failed' });
  }
};

const readBlocks = (html: string): DocumentBlock[] => {
  const fragment = JSDOM.fragment(html);
  const blocks: DocumentBlock[] = [];
  let pageIndex = -1;
  let lineIndex = 0;
  let tableIndex = 0;

  for (const element of Array.from(fragment.children)) {
    let location: DocumentLocation | undefined;
    for (const line of htmlToLines(element.outerHTML)) {
      if (pageIndex === -1 || /^# /.test(line.text)) {
        pageIndex += 1;
        lineIndex = 0;
      }
      location ??= { pageIndex, lineIndex };
      if (line.text !== '') lineIndex += 1;
    }
    location ??= { pageIndex: Math.max(0, pageIndex), lineIndex };
    if (element.tagName === 'TABLE') {
      blocks.push(
        readTable(element as HTMLTableElement, { ...location, tableIndex })
      );
      tableIndex += 1;
    } else {
      blocks.push({ type: 'paragraph', ...readCell(element, location) });
    }
  }
  return blocks;
};

const readTable = (
  table: HTMLTableElement,
  location: DocumentLocation
): Extract<DocumentBlock, { type: 'table' }> => {
  if (table.querySelector('table')) {
    return {
      type: 'table',
      rows: [],
      location,
      unsupportedReason: 'nested_table',
    };
  }

  const rows: DocumentTableCell[][] = Array.from(table.rows, () => []);
  Array.from(table.rows).forEach((row, rowIndex) => {
    let colIndex = 0;
    for (const element of Array.from(row.cells)) {
      while (rows[rowIndex][colIndex]) colIndex += 1;
      const cell = readCell(element, {
        ...location,
        row: rowIndex + 1,
        col: colIndex + 1,
      });
      const rowEnd = Math.min(
        rows.length,
        element.rowSpan === 0 ? rows.length : rowIndex + element.rowSpan
      );
      for (let row = rowIndex; row < rowEnd; row += 1) {
        for (let col = colIndex; col < colIndex + element.colSpan; col += 1) {
          rows[row][col] = cell;
        }
      }
      colIndex += element.colSpan;
    }
  });
  return { type: 'table', rows, location };
};

const readCell = (
  element: Element,
  location: DocumentLocation
): DocumentTableCell => {
  const text = readText(element).trim();
  const hyperlinks = Array.from(element.querySelectorAll('a[href]')).map(
    (anchor): DocumentLink => ({
      text: readText(anchor).trim(),
      target: anchor.getAttribute('href') || null,
      kind: 'hyperlink',
      location,
    })
  );
  return {
    text,
    links: DocumentLinksRules.withTextLinks(text, location, hyperlinks),
    location,
  };
};

const readText = (node: Node): string => {
  if (node.nodeType === node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeName === 'BR') return '\n';
  const text = Array.from(node.childNodes).map(readText).join('');
  return /^(P|LI|H[1-6])$/.test(node.nodeName) ? `${text}\n` : text;
};

// mammoth échappe le texte du document : il ne reste que ses propres balises,
// retirées jusqu'à la dernière pour qu'aucune ne se reforme d'un retrait à
// l'autre.
const TAG = /<[^>]+>/g;

const stripTags = (html: string): string => {
  let text = html;
  let previous: string;
  do {
    previous = text;
    text = text.replace(TAG, '');
  } while (text !== previous);
  return text;
};

type DocxLink = Pick<DocumentLink, 'text' | 'target'>;
type DocxLine = { text: string; hyperlinks: DocxLink[] };

const htmlToLines = (html: string): DocxLine[] => {
  // Le texte suit exactement le rendu existant. Une seconde passe repère
  // les ancres : ses marqueurs ne doivent pas changer les espaces des cellules.
  const textLines = renderBlocks(html)
    .map(lineText)
    .filter((text) => text.length > 0);
  let textIndex = 0;
  return readHyperlinks(html).map(({ text, hyperlinks }) => ({
    text: text.length > 0 ? textLines[textIndex++] : '',
    hyperlinks,
  }));
};

const renderBlocks = (html: string): string[] => {
  const blocks = html
    .replace(/<tr[^>]*>/g, '\n<tr>')
    // Une cellule tient sur sa ligne, même si Word y met des paragraphes.
    .replace(
      /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g,
      (_, cell: string) =>
        `${stripTags(cell.replace(/<\/?(p|br)[^>]*>/g, ' '))
          .replace(/\s+/g, ' ')
          .trim()}\t`
    )
    .replace(/<li[^>]*>/g, '\n- ')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(
      /<(h[1-4])[^>]*>/g,
      (_, tag: string) => `\n${'#'.repeat(Number(tag[1]))} `
    )
    .replace(/<\/(p|h[1-4]|li|tr|table|ul|ol|div)>/g, '\n');
  return stripTags(blocks).split('\n');
};

const lineText = (block: string): string =>
  decodeEntities(block)
    .replace(/[ \t]+$/g, '')
    .trim();

const readHyperlinks = (html: string): DocxLine[] => {
  const links: DocxLink[] = [];
  // Ne peut pas entrer en collision avec un caractère déjà dans le document.
  let prefix = '\uE000tet-link-';
  while (html.includes(prefix)) prefix += '_';
  const marked = html.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/g,
    (_, attributes: string, content: string) => {
      // mammoth produit ses attributs entre guillemets doubles.
      const href = /\bhref="([^"]*)"/.exec(attributes)?.[1];
      // Les signets Word deviennent <a id="…"></a>, sans destination à lire.
      if (href === undefined) return content;
      const index = links.length;
      links.push({
        text: decodeEntities(stripTags(content.replace(/<br\s*\/?>/g, ' ')))
          .replace(/\s+/g, ' ')
          .trim(),
        target: decodeEntities(href) || null,
      });
      return `${prefix}${index}:start\uE001${content}${prefix}${index}:end\uE001`;
    }
  );
  const marker = new RegExp(`${prefix}(\\d+):(start|end)\uE001`, 'g');
  const active = new Set<number>();
  const lines: DocxLine[] = [];
  for (const block of renderBlocks(marked)) {
    const inLine = new Set(active);
    const text = block.replace(marker, (_, id: string, boundary: string) => {
      const index = Number(id);
      inLine.add(index);
      if (boundary === 'start') active.add(index);
      else active.delete(index);
      return '';
    });
    const value = lineText(text);
    const hyperlinks = [...inLine]
      .map((index) => links[index])
      // Une image cliquable n'a pas de ligne de texte à laquelle se rattacher.
      .filter((link) => value.length > 0 || link.text === '');
    if (value.length > 0 || hyperlinks.length > 0) {
      lines.push({ text: value, hyperlinks });
    }
  }
  return lines;
};

const decodeEntities = (text: string): string =>
  text.replace(/&[a-z]+;|&#\d+;/g, (entity) =>
    entity in ENTITIES
      ? ENTITIES[entity]
      : entity.startsWith('&#')
      ? String.fromCodePoint(Number(entity.slice(2, -1)))
      : entity
  );

const toPages = (lines: DocxLine[]): DocumentPage[] => {
  const sections: {
    label?: string;
    lines: DocxLine[];
    unattachedLinks: DocxLink[];
  }[] = [];
  for (const line of lines) {
    const isTopHeading = /^# /.test(line.text);
    if (isTopHeading || sections.length === 0) {
      sections.push({
        label: isTopHeading ? line.text.slice(2) : undefined,
        lines: [],
        unattachedLinks: [],
      });
    }
    if (line.text === '') {
      sections[sections.length - 1].unattachedLinks.push(...line.hyperlinks);
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }
  return sections.map((section, index) => {
    const pageLines = section.lines.map((line, lineIndex): PageLine => {
      const location = { pageIndex: index, lineIndex };
      const hyperlinks: DocumentLink[] = line.hyperlinks.map((link) => ({
        ...link,
        kind: 'hyperlink',
        location,
      }));
      const links = DocumentLinksRules.withTextLinks(
        line.text,
        location,
        hyperlinks
      );
      return {
        text: line.text,
        locations: [location],
        ...(links.length > 0 ? { links } : {}),
      };
    });
    const unattachedLinks: DocumentLink[] = section.unattachedLinks.map(
      (link) => ({ ...link, kind: 'hyperlink', location: { pageIndex: index } })
    );
    return buildPage(index, pageLines, {
      ...(section.label !== undefined ? { label: section.label } : {}),
      ...(unattachedLinks.length > 0
        ? {
            links: [
              ...pageLines.flatMap((line) => line.links ?? []),
              ...unattachedLinks,
            ],
          }
        : {}),
    });
  });
};
