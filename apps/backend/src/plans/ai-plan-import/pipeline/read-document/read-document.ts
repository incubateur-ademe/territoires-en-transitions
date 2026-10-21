import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  buildDocument,
  DocumentKind,
  DocumentPage,
  ReadDocument,
} from '../document/document-page';
import type { SheetGrid } from '../analyze-workbook/sheet-grid';
import { normalizePages } from '../normalize-text/normalize-pages';
import { decideOcr, DEFAULT_OCR_POLICY, OcrPolicy } from './decide-ocr';
import { OcrPageFn } from './llm-ocr-page';
import { ocrPages, OcrPagesResult } from './ocr-pages';
import { readDocxPages } from './read-docx';
import { PdfReader, readPdf } from './read-pdf';
import { readCsvPages, readXlsxPages } from './read-tabular';
import { openPdfPageRenderer, RenderPage } from './render-page-image';

export type ReadDocumentError =
  | { kind: 'unsupported_mime'; mimeType: string }
  | { kind: 'empty_text' }
  | { kind: 'parse_failed' }
  | { kind: 'timeout' }
  | { kind: 'scanned_too_long'; scannedPages: number; maxOcrPages: number }
  | { kind: 'ocr_failed'; failedPages: number[]; reasons: string[] };

export type ReadDocumentOptions = {
  /** Transcription des pages sans texte ; absente, elles restent vides. */
  ocr?: { ocrPage: OcrPageFn; policy?: Partial<OcrPolicy> };
  signal?: AbortSignal;
  /** Injectables en test, à la place de pdf.js. */
  pdfReader?: PdfReader;
  renderPage?: RenderPage;
};

/**
 * Lit le document page par page. Une page sans texte reste `empty` : c'est
 * l'appelant qui décide d'y passer un OCR ; sans aucune page lisible, le
 * document est refusé.
 */
export const readDocument = async (
  args: { buffer: Buffer; mimeType: string },
  options: ReadDocumentOptions = {}
): Promise<Result<ReadDocument, ReadDocumentError>> => {
  const kind = classifyMimeType(args.mimeType);
  if (kind === null) {
    return failure({ kind: 'unsupported_mime', mimeType: args.mimeType });
  }

  const read = await readPages(kind, args.buffer, options);
  if (!read.success) {
    return read;
  }
  if (read.data.workbook) {
    // Les rangées d'un tableur ne sont pas des lignes de page : aucun en-tête
    // ni pied de page à retirer, aucune césure à recoller.
    return validateDocument(
      buildDocument(kind, read.data.pages, [], read.data.workbook)
    );
  }
  const transcribed =
    kind === 'pdf' && options.ocr
      ? await transcribeScannedPages(read.data.pages, args.buffer, {
          ...options,
          ocr: options.ocr,
        })
      : success({ pages: read.data.pages, failures: [] });
  if (!transcribed.success) {
    return transcribed;
  }
  return validateDocument(
    buildDocument(
      kind,
      normalizePages(transcribed.data.pages),
      transcribed.data.failures
    )
  );
};

const validateDocument = (
  document: ReadDocument
): Result<ReadDocument, ReadDocumentError> => {
  if (document.stats.textPages === 0 && document.stats.ocrPages === 0) {
    return failure({ kind: 'empty_text' });
  }
  return success(document);
};

type ReadPages = { pages: DocumentPage[]; workbook?: SheetGrid[] };

const readPages = async (
  kind: DocumentKind,
  buffer: Buffer,
  options: ReadDocumentOptions
): Promise<Result<ReadPages, ReadDocumentError>> => {
  switch (kind) {
    case 'pdf':
      return withPages(await readPdf(buffer, options.pdfReader));
    case 'docx':
      return withPages(await readDocxPages(buffer));
    case 'xlsx':
      return readXlsxPages(buffer);
    case 'csv':
      return success(readCsvPages(buffer));
  }
};

const withPages = <E>(read: Result<DocumentPage[], E>): Result<ReadPages, E> =>
  read.success ? success({ pages: read.data }) : read;

const transcribeScannedPages = (
  pages: DocumentPage[],
  buffer: Buffer,
  {
    ocr,
    signal,
    renderPage,
  }: ReadDocumentOptions & {
    ocr: NonNullable<ReadDocumentOptions['ocr']>;
  }
): Promise<Result<OcrPagesResult, ReadDocumentError>> => {
  const decision = decideOcr(pages, { ...DEFAULT_OCR_POLICY, ...ocr.policy });
  switch (decision.kind) {
    case 'none':
      return Promise.resolve(success({ pages, failures: [] }));
    case 'refuse':
      return Promise.resolve(
        failure({
          kind: 'scanned_too_long',
          scannedPages: decision.scannedPages,
          maxOcrPages: decision.maxOcrPages,
        })
      );
    case 'ocr':
      return withPageRenderer(buffer, renderPage, (render) =>
        ocrPages({
          pages,
          pageIndexes: decision.pageIndexes,
          fullScan: decision.fullScan,
          renderPage: render,
          ocrPage: ocr.ocrPage,
          signal,
        })
      );
  }
};

const withPageRenderer = async <T>(
  buffer: Buffer,
  injected: RenderPage | undefined,
  run: (renderPage: RenderPage) => Promise<T>
): Promise<T> => {
  if (injected) {
    return run(injected);
  }
  const renderer = openPdfPageRenderer(buffer);
  try {
    return await run(renderer.renderPage);
  } finally {
    await renderer.close();
  }
};

export const isTabularMimeType = (mimeType: string): boolean => {
  const kind = classifyMimeType(mimeType);
  return kind === 'csv' || kind === 'xlsx';
};

const classifyMimeType = (mimeType: string): DocumentKind | null => {
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }
  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return 'csv';
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'xlsx';
  }
  return null;
};
