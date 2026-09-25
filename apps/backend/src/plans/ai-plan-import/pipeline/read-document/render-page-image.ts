import sharp from 'sharp';
import { renderPageAsImage } from 'unpdf';

// Un A4 à 150 ppp fait 1 240 px de large : 1 400 px couvre aussi l'A3 paysage.
// En JPEG, une page scannée pèse 150 à 300 Ko contre plusieurs Mo en PNG, et
// c'est la taille de l'image envoyée qui fait la latence de l'OCR.
const DEFAULT_MAX_WIDTH_PX = 1_400;
const JPEG_QUALITY = 80;

export type PageImage = {
  pageIndex: number;
  mimeType: 'image/jpeg';
  data: Buffer;
  width: number;
  height: number;
};

export type RenderPage = (pageIndex: number) => Promise<PageImage>;

/** Rend une page du PDF en JPEG, à la largeur demandée au plus. */
export const renderPageImage = async (
  pdf: Uint8Array,
  pageIndex: number,
  { maxWidthPx = DEFAULT_MAX_WIDTH_PX }: { maxWidthPx?: number } = {}
): Promise<PageImage> => {
  const png = await renderPageAsImage(pdf, pageIndex + 1, {
    canvasImport: () => import('@napi-rs/canvas'),
    width: maxWidthPx,
  });
  const { data, info } = await sharp(Buffer.from(png))
    .resize({ width: maxWidthPx, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return {
    pageIndex,
    mimeType: 'image/jpeg',
    data,
    width: info.width,
    height: info.height,
  };
};

export const buildPdfPageRenderer =
  (buffer: Buffer): RenderPage =>
  (pageIndex) =>
    renderPageImage(new Uint8Array(buffer), pageIndex);
