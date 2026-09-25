import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TimeoutError, withTimeout } from 'es-toolkit';
import mammoth from 'mammoth';
import { buildPage, DocumentPage, PageLine } from '../document/document-page';

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
export const readDocxPages = async (
  buffer: Buffer
): Promise<Result<DocumentPage[], ReadDocxError>> => {
  try {
    const { value: html } = await withTimeout(
      () => mammoth.convertToHtml({ buffer }, { styleMap: STYLE_MAP }),
      DOCX_TIMEOUT_MS
    );
    return success(toPages(htmlToLines(html)));
  } catch (error) {
    if (error instanceof TimeoutError) {
      return failure({ kind: 'timeout' });
    }
    return failure({ kind: 'parse_failed' });
  }
};

const htmlToLines = (html: string): PageLine[] => {
  const lines: string[] = [];
  const blocks = html
    .replace(/<tr[^>]*>/g, '\n<tr>')
    // Une cellule tient sur sa ligne, même si Word y met des paragraphes.
    .replace(
      /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g,
      (_, cell: string) =>
        `${cell
          .replace(/<\/?(p|br)[^>]*>/g, ' ')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()}\t`
    )
    .replace(/<li[^>]*>/g, '\n- ')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(
      /<(h[1-4])[^>]*>/g,
      (_, tag: string) => `\n${'#'.repeat(Number(tag[1]))} `
    )
    .replace(/<\/(p|h[1-4]|li|tr|table|ul|ol|div)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n');
  for (const block of blocks) {
    const text = decodeEntities(block)
      .replace(/[ \t]+$/g, '')
      .trim();
    if (text.length > 0) {
      lines.push(text);
    }
  }
  return lines.map((text) => ({ text }));
};

const decodeEntities = (text: string): string =>
  text.replace(/&[a-z]+;|&#\d+;/g, (entity) =>
    entity in ENTITIES
      ? ENTITIES[entity]
      : entity.startsWith('&#')
      ? String.fromCodePoint(Number(entity.slice(2, -1)))
      : entity
  );

const toPages = (lines: PageLine[]): DocumentPage[] => {
  const sections: { label?: string; lines: PageLine[] }[] = [];
  for (const line of lines) {
    const isTopHeading = /^# /.test(line.text);
    if (isTopHeading || sections.length === 0) {
      sections.push({
        label: isTopHeading ? line.text.slice(2) : undefined,
        lines: [line],
      });
    } else {
      sections[sections.length - 1].lines.push(line);
    }
  }
  return sections.map((section, index) =>
    buildPage(
      index,
      section.lines,
      section.label !== undefined ? { label: section.label } : {}
    )
  );
};
