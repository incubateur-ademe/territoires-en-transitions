import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { deleteAvisErrorConfig } from './delete-avis.errors';
import { deleteAvisInputSchema } from './delete-avis.input';
import { DeleteAvisService } from './delete-avis.service';

@Injectable()
export class DeleteAvisRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly deleteAvisService: DeleteAvisService
  ) {}

  private readonly getResultDataOrThrowError =
    createTrpcErrorHandler(deleteAvisErrorConfig);

  router = this.trpc.router({
    deleteAvis: this.trpc.authedProcedure
      .input(deleteAvisInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.deleteAvisService.deleteAvis(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
