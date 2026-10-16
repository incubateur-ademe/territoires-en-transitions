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
  buildPage(2, [{ text: '18' }]),
];

describe('ocrPages', () => {
  it('remplace les pages transcrites, source ocr', async () => {
    const ocrPage: OcrPageFn = async ({ pageIndex }) =>
      success(`# Page ${pageIndex + 1}\nContenu transcrit`);

    const result = await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
      fullScan: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages[0]).toBe(pages[0]);
      expect(result.data.pages[1]).toMatchObject({
        index: 1,
        source: 'ocr',
        text: '# Page 2\nContenu transcrit',
      });
      expect(result.data.pages[2].source).toBe('ocr');
      expect(result.data.failures).toEqual([]);
    }
  });

  it("garde telle quelle une page où l'OCR ne trouve rien de plus, sans échec", async () => {
    const ocrPage: OcrPageFn = async ({ pageIndex }) =>
      success(pageIndex === 2 ? '18' : '   ');

    const result = await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
      fullScan: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages).toEqual(pages);
      expect(result.data.failures).toEqual([]);
    }
  });

  it('dans un PDF texte, garde une page en échec telle quelle et dit pourquoi', async () => {
    const ocrPage: OcrPageFn = async () =>
      failure({ kind: 'api_error', httpStatus: 500 });

    const result = await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
      fullScan: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages).toEqual(pages);
      expect(result.data.failures).toEqual([
        { pageIndex: 1, reason: 'api_error 500' },
        { pageIndex: 2, reason: 'api_error 500' },
      ]);
    }
  });

  it('fait échouer un document scanné quand trop de pages ne se transcrivent pas', async () => {
    const ocrPage: OcrPageFn = async () => failure({ kind: 'rate_limited' });

    const result = await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
      fullScan: true,
    });

    expect(result).toEqual({
      success: false,
      error: {
        kind: 'ocr_failed',
        failedPages: [1, 2],
        reasons: ['rate_limited'],
      },
    });
  });

  it('tolère un échec isolé dans un document scanné', async () => {
    const ocrPage: OcrPageFn = async ({ pageIndex }) =>
      pageIndex === 1 ? failure({ kind: 'truncated' }) : success('Transcrit');
    const many = Array.from({ length: 10 }, (_, index) => buildPage(index, []));

    const result = await ocrPages({
      pages: many,
      pageIndexes: many.map((page) => page.index),
      renderPage,
      ocrPage,
      fullScan: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages[1].source).toBe('empty');
      expect(result.data.pages[2].source).toBe('ocr');
      expect(result.data.failures).toEqual([
        { pageIndex: 1, reason: 'truncated' },
      ]);
    }
  });

  it('abandonne une page dont la transcription dépasse le délai', async () => {
    const ocrPage = vi.fn(() => new Promise<never>(() => undefined));

    const result = await ocrPages({
      pages,
      pageIndexes: [1],
      renderPage,
      ocrPage,
      fullScan: false,
      pageTimeoutMs: 20,
    });

    expect(result).toEqual(
      success({ pages, failures: [{ pageIndex: 1, reason: 'délai dépassé' }] })
    );
  });

  it("annule l'appel d'une page qui dépasse le délai", async () => {
    const signals: AbortSignal[] = [];
    const ocrPage: OcrPageFn = (_image, signal) => {
      if (signal) {
        signals.push(signal);
      }
      return new Promise<never>(() => undefined);
    };

    await ocrPages({
      pages,
      pageIndexes: [1, 2],
      renderPage,
      ocrPage,
      fullScan: false,
      pageTimeoutMs: 20,
    });

    expect(signals).toHaveLength(2);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it("transmet à l'appel l'interruption de l'import", async () => {
    const job = new AbortController();
    let callSignal: AbortSignal | undefined;
    const ocrPage: OcrPageFn = (_image, signal) => {
      callSignal = signal;
      job.abort();
      return Promise.resolve(failure({ kind: 'api_error', httpStatus: null }));
    };

    await ocrPages({
      pages,
      pageIndexes: [1],
      renderPage,
      ocrPage,
      fullScan: false,
      signal: job.signal,
    });

    expect(callSignal?.aborted).toBe(true);
  });

  it("dans un PDF texte, ne tente plus les pages restantes après trois échecs d'affilée", async () => {
    const ocrPage = vi.fn<OcrPageFn>(async () =>
      failure({ kind: 'api_error', httpStatus: 503 })
    );
    const many = Array.from({ length: 6 }, (_, index) => buildPage(index, []));

    const result = await ocrPages({
      pages: many,
      pageIndexes: many.map((page) => page.index),
      renderPage,
      ocrPage,
      fullScan: false,
      concurrency: 1,
    });

    expect(ocrPage).toHaveBeenCalledTimes(3);
    expect(result).toEqual(
      success({
        pages: many,
        failures: [
          { pageIndex: 0, reason: 'api_error 503' },
          { pageIndex: 1, reason: 'api_error 503' },
          { pageIndex: 2, reason: 'api_error 503' },
          ...[3, 4, 5].map((pageIndex) => ({
            pageIndex,
            reason: 'non tentée après des échecs consécutifs',
          })),
        ],
      })
    );
  });

  it.each([
    ['dépassent le délai', () => new Promise<never>(() => undefined)],
    [
      'reviennent tronquées',
      async () => failure({ kind: 'truncated' as const }),
    ],
  ])(
    'dans un PDF texte, tente toutes les pages qui %s : le modèle boucle sur des photos',
    async (_label, answer) => {
      const ocrPage = vi.fn<OcrPageFn>(answer);
      const many = Array.from({ length: 5 }, (_, index) =>
        buildPage(index, [])
      );

      await ocrPages({
        pages: many,
        pageIndexes: many.map((page) => page.index),
        renderPage,
        ocrPage,
        fullScan: false,
        concurrency: 1,
        pageTimeoutMs: 20,
      });

      expect(ocrPage).toHaveBeenCalledTimes(5);
    }
  );

  it('ne remet pas le compte des erreurs du fournisseur à zéro sur un délai dépassé', async () => {
    const ocrPage = vi.fn<OcrPageFn>(({ pageIndex }) =>
      pageIndex === 2
        ? new Promise<never>(() => undefined)
        : Promise.resolve(failure({ kind: 'api_error', httpStatus: 503 }))
    );
    const many = Array.from({ length: 6 }, (_, index) => buildPage(index, []));

    const result = await ocrPages({
      pages: many,
      pageIndexes: many.map((page) => page.index),
      renderPage,
      ocrPage,
      fullScan: false,
      concurrency: 1,
      pageTimeoutMs: 20,
    });

    expect(ocrPage).toHaveBeenCalledTimes(4);
    expect(result.success && result.data.failures.map((f) => f.reason)).toEqual(
      [
        'api_error 503',
        'api_error 503',
        'délai dépassé',
        'api_error 503',
        'non tentée après des échecs consécutifs',
        'non tentée après des échecs consécutifs',
      ]
    );
  });

  it('continue après des échecs entrecoupés de pages transcrites', async () => {
    const ocrPage = vi.fn<OcrPageFn>(async ({ pageIndex }) =>
      pageIndex % 3 === 2
        ? success('Transcrit')
        : failure({ kind: 'api_error', httpStatus: 500 })
    );
    const many = Array.from({ length: 6 }, (_, index) => buildPage(index, []));

    await ocrPages({
      pages: many,
      pageIndexes: many.map((page) => page.index),
      renderPage,
      ocrPage,
      fullScan: false,
      concurrency: 1,
    });

    expect(ocrPage).toHaveBeenCalledTimes(6);
  });

  it("tente toutes les pages d'un document scanné, même après des échecs d'affilée", async () => {
    const ocrPage = vi.fn<OcrPageFn>(async () =>
      failure({ kind: 'rate_limited' })
    );
    const many = Array.from({ length: 5 }, (_, index) => buildPage(index, []));

    const result = await ocrPages({
      pages: many,
      pageIndexes: many.map((page) => page.index),
      renderPage,
      ocrPage,
      fullScan: true,
      concurrency: 1,
    });

    expect(ocrPage).toHaveBeenCalledTimes(5);
    expect(result.success).toBe(false);
  });

  it('signale un rendu impossible comme un échec de la page', async () => {
    const result = await ocrPages({
      pages,
      pageIndexes: [1],
      renderPage: async () => {
        throw new Error('JPX non supporté');
      },
      ocrPage: vi.fn(),
      fullScan: false,
    });

    expect(result).toEqual(
      success({
        pages,
        failures: [
          { pageIndex: 1, reason: 'rendu impossible (JPX non supporté)' },
        ],
      })
    );
  });
});
