import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { actionStatutSchemaCreate } from '@tet/domain/referentiels';
import { updateActionStatutErrorConfig } from './update-action-statut.errors';
import {
  UpdateActionStatutService,
  upsertActionStatutsRequestSchema,
} from './update-action-statut.service';

@Injectable()
export class UpdateActionStatutRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateActionStatutErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateActionStatutService
  ) {}

  router = this.trpc.router({
    updateStatut: this.trpc.authedProcedure
      .input(actionStatutSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.upsertActionStatuts(
          [input],
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),

    updateStatuts: this.trpc.authedProcedure
      .input(upsertActionStatutsRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.upsertActionStatuts(
          input.actionStatuts,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
