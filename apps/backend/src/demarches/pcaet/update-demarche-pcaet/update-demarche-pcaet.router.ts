import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { updateDemarchePcaetErrorConfig } from './update-demarche-pcaet.errors';
import { updateDemarchePcaetInputSchema } from './update-demarche-pcaet.input';
import { UpdateDemarchePcaetService } from './update-demarche-pcaet.service';

@Injectable()
export class UpdateDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateDemarchePcaetService: UpdateDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    updateDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(updateDemarchePcaetInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.updateDemarchePcaetService.updateDemarchePcaet(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
