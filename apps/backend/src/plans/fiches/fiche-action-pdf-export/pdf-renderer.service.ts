import { Injectable, Logger } from '@nestjs/common';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  type FicheActionPdfExtendedProps,
  type PdfSectionKey,
} from '@tet/pdf-components';
import { createRequire } from 'node:module';
import { Worker } from 'node:worker_threads';

export type PdfExportRenderError =
  | 'RENDER_ERROR'
  | 'RENDER_TIMEOUT'
  | 'RENDER_BUSY';

// Code du worker thread, en CommonJS : chargé tel quel compilé comme sous
// vitest. Les modules sont résolus depuis ce fichier et passés en chemins absolus.
const resolveModule = createRequire(__filename).resolve;
const THREAD_MODULES = {
  reactPdf: resolveModule('@react-pdf/renderer'),
  pdfComponents: resolveModule('@tet/pdf-components'),
};
const THREAD_CODE = `
const { parentPort, workerData } = require('node:worker_threads');
const { renderToBuffer } = require(workerData.modules.reactPdf);
const pdf = require(workerData.modules.pdfComponents);
pdf.registerMarianneForNode();
renderToBuffer(
  pdf.composeFichesPdfDocument({ ...workerData.input, imageSources: pdf.getNodeImageSources() })
).then((buffer) => parentPort.postMessage(buffer, [buffer.buffer]));
`;

// La limite de heap s'applique à chaque thread : on borne le nombre de rendus
// simultanés pour borner la mémoire totale (MAX_CONCURRENT_RENDERS × heap).
// ponytail: refus immédiat au-delà, sans file d'attente. Passer à une file
// bornée (ou piscina) si les refus deviennent fréquents.
const THREAD_MAX_HEAP_MB = 1024;
const MAX_CONCURRENT_RENDERS = 2;

@Injectable()
export class PdfRendererService {
  private readonly logger = new Logger(PdfRendererService.name);
  private activeRenders = 0;

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
    if (this.activeRenders >= MAX_CONCURRENT_RENDERS) {
      this.logger.warn(
        `PDF render refused: ${this.activeRenders} renders already running`
      );
      return failure('RENDER_BUSY');
    }
    this.activeRenders++;

    // renderToBuffer peut boucler indéfiniment sur une mise en page : rendu dans
    // un worker thread pour que l'event loop reste libre et que le délai puisse
    // l'interrompre (un Promise.race ne s'exécute jamais si le thread est bloqué).
    const worker = new Worker(THREAD_CODE, {
      eval: true,
      workerData: {
        modules: THREAD_MODULES,
        input: { fiches, sections, notesYears },
      },
      resourceLimits: { maxOldGenerationSizeMb: THREAD_MAX_HEAP_MB },
    });

    let timer: NodeJS.Timeout | undefined;
    try {
      const pdf = await new Promise<Uint8Array>((resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`PDF render timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
        worker.once('message', resolve);
        worker.once('error', reject);
        worker.once('exit', (code) =>
          reject(new Error(`PDF render thread exited with code ${code}`))
        );
      });
      const buffer = Buffer.from(pdf.buffer, pdf.byteOffset, pdf.byteLength);

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
      clearTimeout(timer);
      void worker.terminate();
      this.activeRenders--;
    }
  }
}
