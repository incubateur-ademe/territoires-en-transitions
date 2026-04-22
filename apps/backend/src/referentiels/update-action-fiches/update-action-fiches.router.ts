import { Injectable } from '@nestjs/common';
import { FicheActionLinkService } from '@tet/backend/plans/fiches/update-fiche/fiche-action-link.service';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { updateActionFichesErrorConfig } from '../../plans/fiches/update-fiche/fiche-action-link.errors';

const updateLinkedFichesInput = z.object({
  actionId: z.string().min(1).max(30),
  collectiviteId: z.number().int().positive(),
  ficheIds: z.array(z.number().int().positive()).max(1000),
});

@Injectable()
export class UpdateActionFichesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly ficheActionLinkService: FicheActionLinkService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateActionFichesErrorConfig
  );

  router = this.trpc.router({
    updateLinkedFiches: this.trpc.authedProcedure
      .input(updateLinkedFichesInput)
      .mutation(async ({ input, ctx }) => {
        const result = await this.ficheActionLinkService.updateLinkedFiches({
          ...input,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
