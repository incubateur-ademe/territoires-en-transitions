import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { buildTestPdf } from '../__fixtures__/build-test-pdf';
import { renderPageImage } from './render-page-image';

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
