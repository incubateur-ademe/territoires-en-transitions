import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { ficheEtapeCreateSchema } from '@tet/domain/plans';
import { z } from 'zod';
import { ficheActionEtapeErrorConfig } from './fiche-action-etape.errors';
import { FicheActionEtapeService } from './fiche-action-etape.service';

@Injectable()
export class FicheActionEtapeRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    ficheActionEtapeErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionEtapeService
  ) {}

  router = this.trpc.router({
    etapes: {
      upsert: this.trpc.authedProcedure
        .input(ficheEtapeCreateSchema)
        .mutation(async ({ ctx, input }) => {
          const result = await this.service.upsertEtape(input, ctx.user);
          return this.getResultDataOrThrowError(result);
        }),
      delete: this.trpc.authedProcedure
        .input(z.object({ etapeId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const result = await this.service.deleteEtape(
            input.etapeId,
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),
      list: this.trpc.authedProcedure
        .input(z.object({ ficheId: z.number() }))
        .query(async ({ ctx, input }) => {
          const result = await this.service.getEtapesByFicheId(
            input.ficheId,
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),
    },
  });
}
