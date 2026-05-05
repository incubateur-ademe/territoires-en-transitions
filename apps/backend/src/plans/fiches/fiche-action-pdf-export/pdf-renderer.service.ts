import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  composeFichesPdfDocument,
  getNodeImageSources,
  registerMarianneForNode,
  type FicheActionPdfExtendedProps,
  type PdfSectionKey,
} from '@tet/pdf-components';

export type PdfExportRenderError = 'RENDER_ERROR' | 'RENDER_TIMEOUT';

@Injectable()
export class PdfRendererService implements OnModuleInit {
  private readonly logger = new Logger(PdfRendererService.name);
  private readonly imageSources = getNodeImageSources();

  onModuleInit(): void {
    registerMarianneForNode();
    this.logger.log('Marianne fonts registered for Node.js PDF rendering');
  }

  async render({
    fiches,
    sections,
    notesYears,
    timeoutMs,
  }: {
    fiches: FicheActionPdfExtendedProps[];
    sections?: PdfSectionKey[];
    notesYears: number[] | 'all';
    timeoutMs: number;
  }): Promise<Result<Buffer, PdfExportRenderError>> {
    const element = composeFichesPdfDocument({
      fiches,
      sections,
      notesYears,
      imageSources: this.imageSources,
    });

    let timer: NodeJS.Timeout | undefined;
    try {
      // renderToBuffer peut bloquer indéfiniment sur un layout complexe ;
      // le timeout évite de garder un worker Node occupé sans limite.
      const buffer = await Promise.race([
        renderToBuffer(element),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(new Error(`PDF render timed out after ${timeoutMs}ms`)),
            timeoutMs
          );
        }),
      ]);

      this.logger.log(`PDF rendered successfully (${buffer.length} bytes)`);
      return success(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('timed out')) {
        this.logger.error(`PDF render timeout: ${message}`);
        return failure('RENDER_TIMEOUT');
      }

      this.logger.error(`PDF render error: ${message}`);
      return failure('RENDER_ERROR');
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
