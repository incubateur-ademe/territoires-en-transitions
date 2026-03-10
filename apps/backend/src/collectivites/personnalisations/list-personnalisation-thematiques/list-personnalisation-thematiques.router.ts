import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listThematiquesInputSchema } from './list-personnalisation-thematiques.input';
import { ListPersonnalisationThematiquesService } from './list-personnalisation-thematiques.service';

@Injectable()
export class ListPersonnalisationThematiquesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listThematiquesService: ListPersonnalisationThematiquesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    listThematiques: this.trpc.authedProcedure
      .input(listThematiquesInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listThematiquesService.listThematiques(
          input,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
