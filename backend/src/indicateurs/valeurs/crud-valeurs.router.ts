import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { getIndicateursValeursRequestSchema } from '../shared/models/get-indicateurs.request';
import { upsertIndicateursValeursRequestSchema } from '../shared/models/upsert-indicateurs-valeurs.request';
import IndicateurValeursService from './crud-valeurs.service';

@Injectable()
export class IndicateurValeursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurValeursService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(getIndicateursValeursRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getIndicateurValeursGroupees(input, ctx.user);
      }),
    upsert: this.trpc.authedProcedure
      .input(upsertIndicateursValeursRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertIndicateurValeurs(input.valeurs, ctx.user);
      }),
  });
}
