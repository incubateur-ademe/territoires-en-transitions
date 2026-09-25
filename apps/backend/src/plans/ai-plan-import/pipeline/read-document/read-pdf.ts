import { failure, Result, success } from '@tet/backend/utils/result.type';
import { delay, TimeoutError, withTimeout } from 'es-toolkit';
import { getDocumentProxy } from 'unpdf';
import { buildPage, DocumentPage } from '../document/document-page';
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
        pages.push(
          buildPage(
            pageNumber - 1,
            reconstructPageLines(items, viewport.height),
            { width: viewport.width, height: viewport.height }
          )
        );
      } finally {
        page.cleanup();
      }
    }
    return pages;
  } finally {
    await document.destroy();
  }
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
