import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { preuvesArchiveErrorConfig } from '../preuves-archive.trpc-errors';
import { getPreuvesArchiveInputSchema } from './get-preuves-archive.input';
import { getPreuvesArchiveOutputSchema } from './get-preuves-archive.output';
import { GetPreuvesArchiveService } from './get-preuves-archive.service';

@Injectable()
export class GetPreuvesArchiveRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getPreuvesArchiveService: GetPreuvesArchiveService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    preuvesArchiveErrorConfig
  );

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(getPreuvesArchiveInputSchema)
      .output(getPreuvesArchiveOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.getPreuvesArchiveService.get({
          archiveId: input.archiveId,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
