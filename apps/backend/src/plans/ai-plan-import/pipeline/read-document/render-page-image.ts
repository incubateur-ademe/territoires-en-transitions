import sharp from 'sharp';
import { getDocumentProxy, renderPageAsImage } from 'unpdf';

// Un A4 à 150 ppp fait 1 240 px de large : 1 400 px couvre aussi l'A3 paysage.
// En JPEG, une page scannée pèse 150 à 300 Ko contre plusieurs Mo en PNG, et
// c'est la taille de l'image envoyée qui fait la latence de l'OCR.
const DEFAULT_MAX_WIDTH_PX = 1_400;
const JPEG_QUALITY = 80;

type PdfDocumentProxy = Awaited<ReturnType<typeof getDocumentProxy>>;

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
  pdf: Uint8Array | PdfDocumentProxy,
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

export type PdfPageRenderer = {
  renderPage: RenderPage;
  close: () => Promise<void>;
};

/** Charge le PDF au premier rendu et le garde pour les pages suivantes. */
export const openPdfPageRenderer = (
  buffer: Buffer,
  loadDocument: (
    pdf: Uint8Array
  ) => Promise<PdfDocumentProxy> = getDocumentProxy
): PdfPageRenderer => {
  let loading: Promise<PdfDocumentProxy> | undefined;
  const load = () => {
    // Un chargement en échec n'est pas gardé : la page suivante le retente.
    loading ??= loadDocument(new Uint8Array(buffer)).catch((error) => {
      loading = undefined;
      throw error;
    });
    return loading;
  };
  return {
    renderPage: async (pageIndex) => {
      const document = await load();
      try {
        return await renderPageImage(document, pageIndex);
      } finally {
        // unpdf ne libère pas la page rendue : pdf.js en garderait les images
        // décodées jusqu'à la fermeture, de quoi saturer la mémoire sur un
        // scan intégral. getPage rend la page déjà chargée, sans la relire.
        const page = await document
          .getPage(pageIndex + 1)
          .catch(() => undefined);
        page?.cleanup();
      }
    },
    close: async () => {
      const document = await loading?.catch(() => undefined);
      // Le PDFDocumentProxy d'unpdf 1.8 n'a plus de destroy() : seule la tâche de chargement libère le worker.
      await document?.loadingTask.destroy();
    },
  };
};
