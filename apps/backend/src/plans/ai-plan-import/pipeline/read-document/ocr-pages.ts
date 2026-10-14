import { Logger } from '@nestjs/common';
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
  /** Hors scan intégral : au-delà, les pages restantes ne sont plus tentées. */
  maxConsecutiveFailures?: number;
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
const SCAN_PAGE_TIMEOUT_MS = 90_000;
// Dans un document qui a du texte, une page presque vide est le plus souvent
// une photo : elle ne vaut pas d'attendre.
const SPARSE_PAGE_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_FAILED_RATIO = 0.2;
// Des échecs qui s'enchaînent viennent du fournisseur, pas des pages : les
// pages suivantes échoueraient pareil, chacune après son délai.
const DEFAULT_MAX_CONSECUTIVE_FAILURES = 3;
const SKIPPED_REASON = 'non tentée après des échecs consécutifs';

const logger = new Logger('OcrPages');

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
  pageTimeoutMs = fullScan ? SCAN_PAGE_TIMEOUT_MS : SPARSE_PAGE_TIMEOUT_MS,
  maxFailedRatio = DEFAULT_MAX_FAILED_RATIO,
  maxConsecutiveFailures = DEFAULT_MAX_CONSECUTIVE_FAILURES,
}: OcrPagesOptions): Promise<Result<OcrPagesResult, OcrPagesError>> => {
  let consecutiveFailures = 0;
  const outcomes = await mapWithConcurrency(
    pageIndexes,
    concurrency,
    async (index): Promise<PageOutcome> => {
      if (!fullScan && consecutiveFailures >= maxConsecutiveFailures) {
        return { kind: 'failed', reason: SKIPPED_REASON };
      }
      const outcome = await transcribePage({
        page: pages[index],
        renderPage,
        ocrPage,
        pageTimeoutMs,
        signal,
      });
      consecutiveFailures =
        outcome.kind === 'failed' ? consecutiveFailures + 1 : 0;
      return outcome;
    }
  );

  const failures = pageIndexes.flatMap((pageIndex, position) => {
    const outcome = outcomes[position];
    return outcome.kind === 'failed'
      ? [{ pageIndex, reason: outcome.reason }]
      : [];
  });
  const skipped = failures.filter((f) => f.reason === SKIPPED_REASON).length;
  if (skipped > 0) {
    logger.warn(
      `OCR interrompu après ${maxConsecutiveFailures} échecs consécutifs : ${skipped} page(s) gardée(s) telles que lues`
    );
  }
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
  // Sans annulation, l'appel expiré poursuivrait ses relances en gardant une
  // place du limiteur de LlmService, et les pages suivantes expireraient à
  // leur tour en attendant.
  const pageAbort = new AbortController();
  const callSignal = signal
    ? AbortSignal.any([signal, pageAbort.signal])
    : pageAbort.signal;
  try {
    return await withTimeout(async (): Promise<PageOutcome> => {
      const image = await renderPage(page.index);
      const result = await ocrPage(image, callSignal);
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
      pageAbort.abort(error);
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
