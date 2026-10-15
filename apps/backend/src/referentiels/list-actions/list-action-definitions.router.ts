import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listActionDefinitionsOutputSchema } from '@tet/domain/referentiels';
import { listActionDefinitionsInputSchema } from './list-action-definitions.input';
import { ListActionDefinitionsService } from './list-action-definitions.service';

@Injectable()
export class ListActionDefinitionsRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  constructor(
    private readonly trpc: TrpcService,
    private readonly listActionDefinitionsService: ListActionDefinitionsService
  ) {}

  router = this.trpc.router({
    // Données publiques et indépendantes de la collectivité, comme
    // `referentiels.definitions.get`
    listActionDefinitions: this.trpc.publicProcedure
      .input(listActionDefinitionsInputSchema)
      // les champs non déclarés dans le schéma ne sont pas exposés
      .output(listActionDefinitionsOutputSchema)
      .query(async ({ input }) => {
        return this.getResultDataOrThrowError(
          await this.listActionDefinitionsService.listActionDefinitions(input)
        );
      }),
  });
}
