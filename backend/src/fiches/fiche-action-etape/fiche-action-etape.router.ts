import { Injectable } from '@nestjs/common';
import { upsertFicheActionEtapeSchema } from '@tet/backend/fiches/fiche-action-etape/fiche-action-etape.table';
import { z } from 'zod';
import { TrpcService } from '../../trpc/trpc.service';
import { FicheActionEtapeService } from './fiche-action-etape.service';

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
