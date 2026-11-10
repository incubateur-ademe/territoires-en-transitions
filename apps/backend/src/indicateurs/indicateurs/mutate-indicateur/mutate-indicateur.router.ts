import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import CreateIndicateurService from './create-indicateur.service';
import { DeleteIndicateurService } from './delete-indicateur.service';
import {
  createIndicateurInputSchema,
  deleteIndicateurInputSchema,
  updateIndicateurInputSchema,
} from './mutate-indicateur.input';
import { UpdateIndicateurService } from './update-indicateur.service';

@Injectable()
export class MutateIndicateurRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  constructor(
    private readonly trpc: TrpcService,
    private readonly createService: CreateIndicateurService,
    private readonly updateService: UpdateIndicateurService,
    private readonly deleteService: DeleteIndicateurService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createIndicateurInputSchema)
      .mutation(({ ctx, input }) => {
        return this.createService.createIndicateurPerso(input, {
          user: ctx.user,
        });
      }),

    update: this.trpc.authedProcedure
      .input(updateIndicateurInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.updateService.updateIndicateur(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),

    delete: this.trpc.authedProcedure
      .input(deleteIndicateurInputSchema)
      .mutation(({ ctx, input }) => {
        return this.deleteService.deleteIndicateurPerso(input, ctx.user);
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
