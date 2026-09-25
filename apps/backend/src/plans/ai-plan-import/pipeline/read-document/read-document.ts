import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  buildDocument,
  DocumentKind,
  DocumentPage,
  ReadDocument,
} from '../document/document-page';
import { normalizePages } from '../normalize-text/normalize-pages';
import { decideOcr, DEFAULT_OCR_POLICY, OcrPolicy } from './decide-ocr';
import { OcrPageFn } from './llm-ocr-page';
import { ocrPages } from './ocr-pages';
import { readDocxPages } from './read-docx';
import { PdfReader, readPdf } from './read-pdf';
import { readCsvPages, readXlsxPages } from './read-tabular';
import { buildPdfPageRenderer, RenderPage } from './render-page-image';

export type ReadDocumentError =
  | { kind: 'unsupported_mime'; mimeType: string }
  | { kind: 'empty_text' }
  | { kind: 'parse_failed' }
  | { kind: 'timeout' }
  | { kind: 'scanned_too_long'; scannedPages: number; maxOcrPages: number }
  | { kind: 'ocr_failed'; failedPages: number[] };

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
  const pages =
    kind === 'pdf' && options.ocr
      ? await transcribeScannedPages(read.data, args.buffer, {
          ...options,
          ocr: options.ocr,
        })
      : success(read.data);
  if (!pages.success) {
    return pages;
  }
  const document = buildDocument(kind, normalizePages(pages.data));
  if (document.stats.textPages === 0 && document.stats.ocrPages === 0) {
    return failure({ kind: 'empty_text' });
  }
  return success(document);
};

const readPages = (
  kind: DocumentKind,
  buffer: Buffer,
  options: ReadDocumentOptions
): Promise<Result<DocumentPage[], ReadDocumentError>> => {
  switch (kind) {
    case 'pdf':
      return readPdf(buffer, options.pdfReader);
    case 'docx':
      return readDocxPages(buffer);
    case 'xlsx':
      return readXlsxPages(buffer);
    case 'csv':
      return Promise.resolve(success(readCsvPages(buffer)));
  }
};

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
): Promise<Result<DocumentPage[], ReadDocumentError>> => {
  const decision = decideOcr(pages, { ...DEFAULT_OCR_POLICY, ...ocr.policy });
  switch (decision.kind) {
    case 'none':
      return Promise.resolve(success(pages));
    case 'refuse':
      return Promise.resolve(
        failure({
          kind: 'scanned_too_long',
          scannedPages: decision.scannedPages,
          maxOcrPages: decision.maxOcrPages,
        })
      );
    case 'ocr':
      return ocrPages({
        pages,
        pageIndexes: decision.pageIndexes,
        renderPage: renderPage ?? buildPdfPageRenderer(buffer),
        ocrPage: ocr.ocrPage,
        signal,
      });
  }
};

/** CSV et Excel : la première ligne du texte est l'en-tête du tableau. */
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
