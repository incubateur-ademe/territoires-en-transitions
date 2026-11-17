import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { upsertIndicateurFichesErrorConfig } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.errors';
import { createIndicateurErrorConfig } from './create-indicateur.errors';
import CreateIndicateurService from './create-indicateur.service';
import { DeleteIndicateurService } from './delete-indicateur.service';
import {
  createIndicateurInputSchema,
  deleteIndicateurInputSchema,
  updateIndicateurInputSchema,
} from './mutate-indicateur.input';
import { updateIndicateurErrorConfig } from './update-indicateur.errors';
import { UpdateIndicateurService } from './update-indicateur.service';

@Injectable()
export class MutateIndicateurRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    upsertIndicateurFichesErrorConfig
  );
  private readonly getUpdateResultDataOrThrowError = createTrpcErrorHandler(
    updateIndicateurErrorConfig
  );
  private readonly getCreateResultDataOrThrowError = createTrpcErrorHandler(
    createIndicateurErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly createService: CreateIndicateurService,
    private readonly updateService: UpdateIndicateurService,
    private readonly deleteService: DeleteIndicateurService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createIndicateurInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.createService.createIndicateurPerso(input, {
          user: ctx.user,
        });
        return this.getCreateResultDataOrThrowError(result);
      }),

    update: this.trpc.authedProcedure
      .input(updateIndicateurInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.updateService.updateIndicateur(input, {
          user: ctx.user,
        });
        return this.getUpdateResultDataOrThrowError(result);
      }),

    listSousIndicateursBecomingAutonomous: this.trpc.authedProcedure
      .input(deleteIndicateurInputSchema)
      .query(async ({ ctx, input }) => {
        const result =
          await this.deleteService.listSousIndicateursBecomingAutonomous(
            input,
            { user: ctx.user }
          );
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
