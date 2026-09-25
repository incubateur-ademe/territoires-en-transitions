import { mapWithConcurrency } from '@tet/backend/utils/map-with-concurrency';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TimeoutError, withTimeout } from 'es-toolkit';
import { buildPage, DocumentPage } from '../document/document-page';
import { OcrPageFn } from './llm-ocr-page';
import { RenderPage } from './render-page-image';

export type OcrPagesOptions = {
  pages: DocumentPage[];
  pageIndexes: number[];
  renderPage: RenderPage;
  ocrPage: OcrPageFn;
  signal?: AbortSignal;
  /** Le limiteur de LlmService borne déjà les appels ; ceci borne les rendus en mémoire. */
  concurrency?: number;
  pageTimeoutMs?: number;
  /** Part des pages en échec tolérée avant d'abandonner l'import. */
  maxFailedRatio?: number;
};

export type OcrPagesError = { kind: 'ocr_failed'; failedPages: number[] };

const DEFAULT_CONCURRENCY = 2;
const DEFAULT_PAGE_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_FAILED_RATIO = 0.2;

/**
 * Transcrit les pages désignées et les remplace dans le document. Une page
 * qui échoue reste vide ; trop de pages en échec, et c'est l'import qui
 * échoue, car le programme d'actions y est peut-être.
 */
export const ocrPages = async ({
  pages,
  pageIndexes,
  renderPage,
  ocrPage,
  signal,
  concurrency = DEFAULT_CONCURRENCY,
  pageTimeoutMs = DEFAULT_PAGE_TIMEOUT_MS,
  maxFailedRatio = DEFAULT_MAX_FAILED_RATIO,
}: OcrPagesOptions): Promise<Result<DocumentPage[], OcrPagesError>> => {
  const results = await mapWithConcurrency(pageIndexes, concurrency, (index) =>
    transcribePage({
      page: pages[index],
      renderPage,
      ocrPage,
      pageTimeoutMs,
      signal,
    })
  );

  const failedPages = pageIndexes.filter(
    (_, position) => results[position] === null
  );
  if (failedPages.length > Math.floor(pageIndexes.length * maxFailedRatio)) {
    return failure({ kind: 'ocr_failed', failedPages });
  }

  const transcribed = new Map(
    pageIndexes.flatMap((index, position) => {
      const page = results[position];
      return page ? [[index, page] as const] : [];
    })
  );
  return success(pages.map((page) => transcribed.get(page.index) ?? page));
};

const transcribePage = async ({
  page,
  renderPage,
  ocrPage,
  pageTimeoutMs,
  signal,
}: {
  page: DocumentPage;
  renderPage: RenderPage;
  ocrPage: OcrPageFn;
  pageTimeoutMs: number;
  signal?: AbortSignal;
}): Promise<DocumentPage | null> => {
  try {
    const text = await withTimeout(async () => {
      const image = await renderPage(page.index);
      const result = await ocrPage(image, signal);
      return result.success ? result.data : null;
    }, pageTimeoutMs);
    if (text === null || text.trim().length === 0) {
      return null;
    }
    return buildPage(
      page.index,
      text.split('\n').map((line) => ({ text: line.trimEnd() })),
      { source: 'ocr', width: page.width, height: page.height }
    );
  } catch (error) {
    if (error instanceof TimeoutError || signal?.aborted) {
      return null;
    }
    // Rendu impossible (image exotique) : la page reste vide, comme un échec OCR.
    return null;
  }
};
