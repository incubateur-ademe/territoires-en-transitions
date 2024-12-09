import { TrpcService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { FicheActionEtapeService } from './fiche-action-etape.service';
import { upsertFicheActionEtapeSchema } from './fiche-action-etape.table';

@Injectable()
export class FicheActionEtapeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionEtapeService
  ) {}

  router = this.trpc.router({
    etapes: {
      upsert: this.trpc.authedProcedure
        .input(upsertFicheActionEtapeSchema)
        .query(({ ctx, input }) => {
          return this.service.upsertEtape(input, ctx.user);
        }),
      delete: this.trpc.authedProcedure
        .input(z.object({ etapeId: z.number() }))
        .query(({ ctx, input }) => {
          return this.service.deleteEtape(input.etapeId, ctx.user);
        }),
      list: this.trpc.authedProcedure
        .input(z.object({ ficheId: z.number() }))
        .query(({ ctx, input }) => {
          return this.service.getEtapesByFicheId(input.ficheId, ctx.user);
        }),
    },
  });
}
