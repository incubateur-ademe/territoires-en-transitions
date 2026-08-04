import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { deleteDemarchePcaetErrorConfig } from './delete-demarche-pcaet.errors';
import { deleteDemarchePcaetInputSchema } from './delete-demarche-pcaet.input';
import { DeleteDemarchePcaetService } from './delete-demarche-pcaet.service';

@Injectable()
export class DeleteDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly deleteDemarchePcaetService: DeleteDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    deleteDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    delete: this.trpc.authedProcedure
      .input(deleteDemarchePcaetInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.deleteDemarchePcaetService.deleteDemarchePcaet(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
