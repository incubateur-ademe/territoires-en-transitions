import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { preuvesArchiveErrorConfig } from '../preuves-archive.trpc-errors';
import { requestPreuvesArchiveInputSchema } from './request-preuves-archive.input';
import { requestPreuvesArchiveOutputSchema } from './request-preuves-archive.output';
import { RequestPreuvesArchiveService } from './request-preuves-archive.service';

@Injectable()
export class RequestPreuvesArchiveRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly requestPreuvesArchiveService: RequestPreuvesArchiveService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    preuvesArchiveErrorConfig
  );

  router = this.trpc.router({
    request: this.trpc.authedProcedure
      .input(requestPreuvesArchiveInputSchema)
      .output(requestPreuvesArchiveOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.requestPreuvesArchiveService.request({
          ...input,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
