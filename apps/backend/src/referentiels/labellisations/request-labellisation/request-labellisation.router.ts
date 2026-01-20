import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { requestLabellisationErrorConfig } from './request-labellisation.errors';
import { requestLabellisationInputSchema } from './request-labellisation.input';
import { RequestLabellisationService } from './request-labellisation.service';

@Injectable()
export class RequestLabellisationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly requestLabellisationService: RequestLabellisationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    requestLabellisationErrorConfig
  );

  router = this.trpc.router({
    requestLabellisation: this.trpc.authedProcedure
      .input(requestLabellisationInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.requestLabellisationService.requestLabellisation(input, user);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
