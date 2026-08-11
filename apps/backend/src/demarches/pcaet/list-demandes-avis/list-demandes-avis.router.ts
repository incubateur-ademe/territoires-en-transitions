import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDemandesAvisErrorConfig } from './list-demandes-avis.errors';
import { listDemandesAvisInputSchema } from './list-demandes-avis.input';
import { ListDemandesAvisService } from './list-demandes-avis.service';

@Injectable()
export class ListDemandesAvisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemandesAvisService: ListDemandesAvisService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDemandesAvisErrorConfig
  );

  router = this.trpc.router({
    listDemandesAvis: this.trpc.authedProcedure
      .input(listDemandesAvisInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listDemandesAvisService.listDemandesAvis(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
