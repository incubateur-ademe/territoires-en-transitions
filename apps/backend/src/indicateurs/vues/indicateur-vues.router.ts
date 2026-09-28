import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { indicateurVuesErrorConfig } from './indicateur-vues.errors';
import {
  createIndicateurVueInputSchema,
  deleteIndicateurVueInputSchema,
  listIndicateurVuesInputSchema,
  updateIndicateurVueInputSchema,
} from './indicateur-vues.input';
import { IndicateurVuesService } from './indicateur-vues.service';

@Injectable()
export class IndicateurVuesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: IndicateurVuesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    indicateurVuesErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listIndicateurVuesInputSchema)
      .query(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.list(input, { user: ctx.user })
        )
      ),
    create: this.trpc.authedProcedure
      .input(createIndicateurVueInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.create(input, { user: ctx.user })
        )
      ),
    update: this.trpc.authedProcedure
      .input(updateIndicateurVueInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.update(input, { user: ctx.user })
        )
      ),
    delete: this.trpc.authedProcedure
      .input(deleteIndicateurVueInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.delete(input, { user: ctx.user })
        )
      ),
  });
}
