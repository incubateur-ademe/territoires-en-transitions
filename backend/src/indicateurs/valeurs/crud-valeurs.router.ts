import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { deleteValeurIndicateurSchema } from '../shared/models/delete-valeur-indicateur.request';
import { getIndicateursValeursRequestSchema } from '../shared/models/get-indicateurs.request';
import { upsertValeurIndicateurSchema } from '../shared/models/upsert-valeur-indicateur.request';
import IndicateurValeursService from './crud-valeurs.service';
import { getAverageValuesRequestSchema } from './get-average-values.request';
import ValeursCalculeesService from './valeurs-calculees.service';

@Injectable()
export class IndicateurValeursRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurValeursService,
    private readonly valeursCalculees: ValeursCalculeesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(getIndicateursValeursRequestSchema)
      .query(({ ctx, input }) => {
        return this.service.getIndicateurValeursGroupees(input, ctx.user);
      }),
    upsert: this.trpc.authedProcedure
      .input(upsertValeurIndicateurSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertValeur(input, ctx.user);
      }),
    delete: this.trpc.authedProcedure
      .input(deleteValeurIndicateurSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deleteValeurIndicateur(input, ctx.user);
      }),
    average: this.trpc.authedProcedure
      .input(getAverageValuesRequestSchema)
      .query(({ ctx, input }) => {
        return this.valeursCalculees.getAverageValues(input, ctx.user);
      }),
  });
}
