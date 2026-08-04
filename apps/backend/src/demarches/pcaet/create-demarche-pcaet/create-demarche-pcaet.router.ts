import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createDemarchePcaetErrorConfig } from './create-demarche-pcaet.errors';
import { createDemarchePcaetInputSchema } from './create-demarche-pcaet.input';
import { CreateDemarchePcaetService } from './create-demarche-pcaet.service';

@Injectable()
export class CreateDemarchePcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly createDemarchePcaetService: CreateDemarchePcaetService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createDemarchePcaetErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createDemarchePcaetInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.createDemarchePcaetService.createDemarchePcaet(input, {
            user: ctx.user,
          });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
