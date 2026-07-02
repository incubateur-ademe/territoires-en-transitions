import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { actionIdSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { handleMesurePilotesErrorConfig } from './handle-mesure-pilotes.errors';
import { HandleMesurePilotesService } from './handle-mesure-pilotes.service';

const upsertPilotesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: actionIdSchema,
  pilotes: z.array(
    z.object({
      userId: z.string().optional().nullable(),
      tagId: z.int().optional().nullable(),
    })
  ),
});

const deletePilotesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: actionIdSchema,
});

@Injectable()
export class HandleMesurePilotesRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    handleMesurePilotesErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleMesurePilotesService
  ) {}

  router = this.trpc.router({
    upsertPilotes: this.trpc.authedProcedure
      .input(upsertPilotesSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.upsertPilotes(
          input.collectiviteId,
          input.mesureId,
          input.pilotes,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),

    deletePilotes: this.trpc.authedProcedure
      .input(deletePilotesSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.deletePilotes(
          input.collectiviteId,
          input.mesureId,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
