import sharp from 'sharp';
import * as unpdf from 'unpdf';
import { describe, expect, it, vi } from 'vitest';
import { buildTestPdf } from '../__fixtures__/build-test-pdf';
import { openPdfPageRenderer, renderPageImage } from './render-page-image';

vi.mock('unpdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('unpdf')>();
  return { ...actual, getDocumentProxy: vi.fn(actual.getDocumentProxy) };
});

const scannedPageJpeg = () =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1754">
        <rect width="100%" height="100%" fill="white"/>
        <text x="80" y="160" font-size="48" font-family="sans-serif">AXE 1 : PAGE SCANNÉE</text>
      </svg>`
    )
  )
    .jpeg({ quality: 80 })
    .toBuffer();

describe('renderPageImage', () => {
  it('rend une page en JPEG, au plus 1 400 px de large', async () => {
    const pdf = buildTestPdf([
      {
        kind: 'image',
        jpeg: await scannedPageJpeg(),
        width: 1240,
        height: 1754,
      },
    ]);

    const image = await renderPageImage(new Uint8Array(pdf), 0);

    expect(image.mimeType).toBe('image/jpeg');
    expect(image.width).toBeLessThanOrEqual(1400);
    expect(image.width).toBeGreaterThan(500);
    expect(image.data.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
    expect(await sharp(image.data).metadata()).toMatchObject({
      format: 'jpeg',
      width: image.width,
    });
  });
});

describe('openPdfPageRenderer', () => {
  it('charge le PDF une seule fois pour toutes les pages rendues', async () => {
    const page = {
      kind: 'image' as const,
      jpeg: await scannedPageJpeg(),
      width: 1240,
      height: 1754,
    };
    const renderer = openPdfPageRenderer(buildTestPdf([page, page, page]));
    vi.mocked(unpdf.getDocumentProxy).mockClear();

    const images = await Promise.all([
      renderer.renderPage(0),
      renderer.renderPage(1),
    ]);
    images.push(await renderer.renderPage(2));
    await renderer.close();

    expect(unpdf.getDocumentProxy).toHaveBeenCalledTimes(1);
    expect(images.map((image) => image.pageIndex)).toEqual([0, 1, 2]);
    for (const image of images) {
      expect(image.data.subarray(0, 3)).toEqual(
        Buffer.from([0xff, 0xd8, 0xff])
      );
    }
  });

  it('libère chaque page une fois rendue', async () => {
    const page = {
      kind: 'image' as const,
      jpeg: await scannedPageJpeg(),
      width: 1240,
      height: 1754,
    };
    const renderer = openPdfPageRenderer(buildTestPdf([page, page, page]));
    vi.mocked(unpdf.getDocumentProxy).mockClear();
    await renderer.renderPage(0);
    const document = await vi.mocked(unpdf.getDocumentProxy).mock.results[0]
      .value;
    const cleanup = vi.spyOn(
      Object.getPrototypeOf(await document.getPage(1)),
      'cleanup'
    );

    try {
      await renderer.renderPage(1);
      await renderer.renderPage(2);

      expect(
        cleanup.mock.contexts.map(
          (released) => (released as { _pageIndex: number })._pageIndex
        )
      ).toEqual([1, 2]);
    } finally {
      cleanup.mockRestore();
      await renderer.close();
    }
  });
});
