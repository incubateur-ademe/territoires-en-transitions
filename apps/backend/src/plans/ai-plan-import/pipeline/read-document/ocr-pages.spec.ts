import { failure, success } from '@tet/backend/utils/result.type';
import { describe, expect, it, vi } from 'vitest';
import { buildPage } from '../document/document-page';
import { OcrPageFn } from './llm-ocr-page';
import { ocrPages } from './ocr-pages';
import { PageImage, RenderPage } from './render-page-image';

const image = (pageIndex: number): PageImage => ({
  pageIndex,
  mimeType: 'image/jpeg',
  data: Buffer.from('jpeg'),
  width: 100,
  height: 140,
});

const renderPage: RenderPage = async (pageIndex) => image(pageIndex);

const pages = [
  buildPage(0, [{ text: 'Texte lu par pdf.js' }]),
  buildPage(1, []),
  buildPage(2, []),
];

describe('ocrPages', () => {
  it('remplace les pages désignées par leur transcription, source ocr', async () => {
    const ocrPage: OcrPageFn = async ({ pageIndex }) =>
      success(`# Page ${pageIndex + 1}\nContenu transcrit`);

    const result = await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0]).toBe(pages[0]);
      expect(result.data[1]).toMatchObject({
        index: 1,
        source: 'ocr',
        text: '# Page 2\nContenu transcrit',
      });
      expect(result.data[2].source).toBe('ocr');
    }
  });

  it('tolère un échec isolé, la page restant vide', async () => {
    const ocrPage: OcrPageFn = async ({ pageIndex }) =>
      pageIndex === 1
        ? failure({ kind: 'api_error', httpStatus: 500 })
        : success('Transcrit');
    const many = Array.from({ length: 10 }, (_, index) => buildPage(index, []));

    const result = await ocrPages({
      pages: many,
      pageIndexes: many.map((page) => page.index),
      renderPage,
      ocrPage,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[1].source).toBe('empty');
      expect(result.data[2].source).toBe('ocr');
    }
  });

  it('échoue quand trop de pages ne peuvent pas être transcrites', async () => {
    const ocrPage: OcrPageFn = async () =>
      failure({ kind: 'api_error', httpStatus: 500 });

    const result = await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'ocr_failed', failedPages: [1, 2] },
    });
  });

  it('abandonne une page dont la transcription dépasse le délai', async () => {
    const ocrPage = vi.fn(() => new Promise<never>(() => undefined));

    const result = await ocrPages({
      pages,
      pageIndexes: [1],
      renderPage,
      ocrPage,
      pageTimeoutMs: 20,
    });

    expect(result).toEqual({
      success: false,
      error: { kind: 'ocr_failed', failedPages: [1] },
    });
  });
});
