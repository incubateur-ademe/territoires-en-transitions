import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listFichesRequestFiltersSchema } from '@tet/domain/plans';
import { allSectionKeys } from '@tet/pdf-components';
import { FICHE_ACTION_PDF_EXPORT_CONFIG } from './fiche-action-pdf-export.config';
import z from 'zod';
import { sortSchema } from '@tet/backend/plans/fiches/list-fiches/list-fiches.request';
import { FicheActionPdfExportService } from './fiche-action-pdf-export.service';
import { ficheActionPdfExportErrorConfig } from './fiche-action-pdf-export.errors';

const generatePdfInputSchema = z.intersection(
  z.object({
    sections: z.array(z.enum(allSectionKeys)).optional(),
    notesYears: z.array(z.number().int()).or(z.literal('all')),
  }),
  z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('selection'),
      ficheIds: z
        .array(z.number().int().positive())
        .min(1)
        .max(FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches),
    }),
    z.object({
      mode: z.literal('all'),
      collectiviteId: z.number().int().positive(),
      filters: listFichesRequestFiltersSchema.optional(),
      sort: sortSchema,
    }),
  ])
);

@Injectable()
export class FicheActionPdfExportRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionPdfExportService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    ficheActionPdfExportErrorConfig
  );

  router = this.trpc.router({
    generatePdf: this.trpc.authedProcedure
      .input(generatePdfInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.generatePdf({ ...input, user: ctx.user });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
