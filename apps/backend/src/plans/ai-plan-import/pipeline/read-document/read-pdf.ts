import { failure, Result, success } from '@tet/backend/utils/result.type';
import { delay, TimeoutError, withTimeout } from 'es-toolkit';
import { getDocumentProxy } from 'unpdf';
import { DocumentLinksRules } from '../document/document-links.rules';
import {
  buildPage,
  DocumentLink,
  DocumentLocation,
  DocumentPage,
} from '../document/document-page';
import { reconstructPageLines, TextItemLike } from './reconstruct-page-lines';

// Quelques dizaines de millisecondes par page : 400 pages tiennent largement.
const PDF_TIMEOUT_MS = 60_000;
const PDF_PARSE_ATTEMPTS = 3;
const PDF_RETRY_DELAY_MS = 50;

export type PdfReader = (buffer: Buffer) => Promise<DocumentPage[]>;

export type ReadPdfError = { kind: 'parse_failed' } | { kind: 'timeout' };

export const readPdfPages: PdfReader = async (buffer) => {
  const document = await getDocumentProxy(new Uint8Array(buffer));
  try {
    const pages: DocumentPage[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      try {
        const viewport = page.getViewport({ scale: 1 });
        const content = await page.getTextContent();
        // pdf.js mêle aux fragments des marqueurs de contenu balisé, sans texte.
        const items = content.items.flatMap((item) =>
          isTextItem(item) ? [item] : []
        );
        const annotations = readAnnotations(
          await page.getAnnotations(),
          items,
          pageNumber - 1,
          viewport.height
        );
        const lines = reconstructPageLines(
          items.map((item) => ({
            ...item,
            links: annotations.filter(
              (link) =>
                link.location.rect && intersects(item, link.location.rect)
            ),
          })),
          viewport.height,
          pageNumber - 1
        ).map((line, lineIndex) => {
          const hyperlinks = line.links ?? [];
          const links = DocumentLinksRules.withTextLinks(
            line.text,
            {
              pageIndex: pageNumber - 1,
              lineIndex,
            },
            hyperlinks
          );
          return { ...line, ...(links.length > 0 ? { links } : {}) };
        });
        const lineLinks = lines.flatMap((line) => line.links ?? []);
        const unattachedLinks = annotations.filter(
          (annotation) =>
            !lineLinks.some(
              (link) =>
                link.kind === 'hyperlink' &&
                link.location.rect === annotation.location.rect
            )
        );
        pages.push(
          buildPage(pageNumber - 1, lines, {
            width: viewport.width,
            height: viewport.height,
            ...((lineLinks.length > 0 || unattachedLinks.length > 0) && {
              links: [...lineLinks, ...unattachedLinks],
            }),
          })
        );
      } finally {
        page.cleanup();
      }
    }
    return pages;
  } finally {
    // Le PDFDocumentProxy d'unpdf 1.8 n'a plus de destroy() : seule la tâche de chargement libère le worker.
    await document.loadingTask.destroy();
  }
};

const readAnnotations = (
  annotations: unknown[],
  items: TextItemLike[],
  pageIndex: number,
  pageHeight: number
): DocumentLink[] =>
  annotations.flatMap((annotation) => {
    if (
      typeof annotation !== 'object' ||
      annotation === null ||
      !('subtype' in annotation) ||
      annotation.subtype !== 'Link'
    ) {
      return [];
    }
    const target =
      'unsafeUrl' in annotation && typeof annotation.unsafeUrl === 'string'
        ? annotation.unsafeUrl
        : 'url' in annotation && typeof annotation.url === 'string'
        ? annotation.url
        : null;
    const rect =
      'rect' in annotation && isRect(annotation.rect)
        ? annotation.rect
        : undefined;
    // pdf.js fournit des fragments : le libellé peut inclure les mots voisins
    // d'une annotation qui ne couvre qu'une partie du fragment.
    const labelItems = rect
      ? items.filter((item) => intersects(item, rect))
      : [];
    return [
      {
        text: reconstructPageLines(labelItems, pageHeight)
          .map((line) => line.text)
          .join('\n'),
        target: target || null,
        kind: 'hyperlink',
        location: { pageIndex, ...(rect ? { rect } : {}) },
      },
    ];
  });

const isRect = (
  value: unknown
): value is NonNullable<DocumentLocation['rect']> =>
  Array.isArray(value) &&
  value.length === 4 &&
  value.every(
    (coordinate) =>
      typeof coordinate === 'number' && Number.isFinite(coordinate)
  );

/** Une annotation sans fragment recouvert reste au niveau de la page. */
const intersects = (
  item: TextItemLike,
  rect: NonNullable<DocumentLocation['rect']>
): boolean => {
  const [, b, c, , x, y] = item.transform;
  // La reconstruction existante lit les lignes horizontales. Ne pas attribuer
  // un lien à un texte tourné à partir d'un rectangle approximatif.
  if (b !== 0 || c !== 0 || item.str.trim() === '') return false;
  const [left, bottom, right, top] = rect;
  return (
    Math.max(left, x) < Math.min(right, x + item.width) &&
    Math.max(bottom, y) < Math.min(top, y + item.height)
  );
};

const isTextItem = (item: unknown): item is TextItemLike =>
  typeof item === 'object' &&
  item !== null &&
  'str' in item &&
  typeof item.str === 'string' &&
  'transform' in item &&
  Array.isArray(item.transform);

/**
 * pdf.js échoue parfois de façon passagère (« bad XRef entry ») : on
 * réessaie, sauf sur dépassement du délai.
 */
export const readPdf = (
  buffer: Buffer,
  read: PdfReader = readPdfPages
): Promise<Result<DocumentPage[], ReadPdfError>> =>
  attemptRead({ buffer, read, attemptsLeft: PDF_PARSE_ATTEMPTS });

const attemptRead = async (args: {
  buffer: Buffer;
  read: PdfReader;
  attemptsLeft: number;
}): Promise<Result<DocumentPage[], ReadPdfError>> => {
  try {
    return success(
      await withTimeout(() => args.read(args.buffer), PDF_TIMEOUT_MS)
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return failure({ kind: 'timeout' });
    }
    const cause = error instanceof Error ? error : new Error(String(error));
    if (args.attemptsLeft <= 1) {
      return failure({ kind: 'parse_failed' }, cause);
    }
    await delay(PDF_RETRY_DELAY_MS);
    return attemptRead({ ...args, attemptsLeft: args.attemptsLeft - 1 });
  }
};
