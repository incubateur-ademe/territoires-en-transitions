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
  /**
   * Document scanné de bout en bout : sans OCR il n'y a rien à lire, trop
   * d'échecs font échouer l'import. Sinon, un échec laisse la page telle que
   * pdf.js l'a lue.
   */
  fullScan: boolean;
  signal?: AbortSignal;
  /** Le limiteur de LlmService borne déjà les appels ; ceci borne les rendus en mémoire. */
  concurrency?: number;
  pageTimeoutMs?: number;
  /** Part des pages en échec tolérée, pour un document scanné. */
  maxFailedRatio?: number;
};

export type OcrFailure = { pageIndex: number; reason: string };

export type OcrPagesResult = {
  pages: DocumentPage[];
  /** Pages dont la transcription a échoué, gardées telles quelles. */
  failures: OcrFailure[];
};

export type OcrPagesError = {
  kind: 'ocr_failed';
  failedPages: number[];
  reasons: string[];
};

const DEFAULT_CONCURRENCY = 2;
const DEFAULT_PAGE_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_FAILED_RATIO = 0.2;

type PageOutcome =
  | { kind: 'transcribed'; page: DocumentPage }
  // Une photo, un intercalaire : l'OCR n'y trouve rien, et c'est normal.
  | { kind: 'blank' }
  | { kind: 'failed'; reason: string };

/** Transcrit les pages désignées et les remplace dans le document. */
export const ocrPages = async ({
  pages,
  pageIndexes,
  renderPage,
  ocrPage,
  fullScan,
  signal,
  concurrency = DEFAULT_CONCURRENCY,
  pageTimeoutMs = DEFAULT_PAGE_TIMEOUT_MS,
  maxFailedRatio = DEFAULT_MAX_FAILED_RATIO,
}: OcrPagesOptions): Promise<Result<OcrPagesResult, OcrPagesError>> => {
  const outcomes = await mapWithConcurrency(pageIndexes, concurrency, (index) =>
    transcribePage({
      page: pages[index],
      renderPage,
      ocrPage,
      pageTimeoutMs,
      signal,
    })
  );

  const failures = pageIndexes.flatMap((pageIndex, position) => {
    const outcome = outcomes[position];
    return outcome.kind === 'failed'
      ? [{ pageIndex, reason: outcome.reason }]
      : [];
  });
  if (
    fullScan &&
    failures.length > Math.floor(pageIndexes.length * maxFailedRatio)
  ) {
    return failure({
      kind: 'ocr_failed',
      failedPages: failures.map((f) => f.pageIndex),
      reasons: [...new Set(failures.map((f) => f.reason))],
    });
  }

  const transcribed = new Map(
    pageIndexes.flatMap((index, position) => {
      const outcome = outcomes[position];
      return outcome.kind === 'transcribed'
        ? [[index, outcome.page] as const]
        : [];
    })
  );
  return success({
    pages: pages.map((page) => transcribed.get(page.index) ?? page),
    failures,
  });
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
}): Promise<PageOutcome> => {
  try {
    return await withTimeout(async (): Promise<PageOutcome> => {
      const image = await renderPage(page.index);
      const result = await ocrPage(image, signal);
      if (!result.success) {
        return { kind: 'failed', reason: describeLlmError(result.error) };
      }
      const text = result.data.trim();
      if (text.length === 0 || text.length <= page.text.trim().length) {
        return { kind: 'blank' };
      }
      return {
        kind: 'transcribed',
        page: buildPage(
          page.index,
          text.split('\n').map((line) => ({ text: line.trimEnd() })),
          { source: 'ocr', width: page.width, height: page.height }
        ),
      };
    }, pageTimeoutMs);
  } catch (error) {
    if (error instanceof TimeoutError) {
      return { kind: 'failed', reason: 'délai dépassé' };
    }
    if (signal?.aborted) {
      return { kind: 'failed', reason: 'import interrompu' };
    }
    return {
      kind: 'failed',
      reason: `rendu impossible (${
        error instanceof Error ? error.message : String(error)
      })`,
    };
  }
};

const describeLlmError = (error: {
  kind: string;
  httpStatus?: number | null;
}): string =>
  error.kind === 'api_error' && error.httpStatus
    ? `api_error ${error.httpStatus}`
    : error.kind;
