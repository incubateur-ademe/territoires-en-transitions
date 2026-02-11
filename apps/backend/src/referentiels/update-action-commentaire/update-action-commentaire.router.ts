import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { actionCommentaireSchemaCreate } from '@tet/domain/referentiels';
import { updateActionCommentaireErrorConfig } from './update-action-commentaire.errors';
import { UpdateActionCommentaireService } from './update-action-commentaire.service';

@Injectable()
export class UpdateActionCommentaireRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateActionCommentaireService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateActionCommentaireErrorConfig
  );

  router = this.trpc.router({
    updateCommentaire: this.trpc.authedProcedure
      .input(actionCommentaireSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.updateCommentaire(input, ctx.user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
