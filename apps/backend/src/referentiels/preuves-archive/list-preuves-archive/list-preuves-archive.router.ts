import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { preuvesArchiveErrorConfig } from '../preuves-archive.trpc-errors';
import { listPreuvesArchiveInputSchema } from './list-preuves-archive.input';
import { listPreuvesArchiveOutputSchema } from './list-preuves-archive.output';
import { ListPreuvesArchiveService } from './list-preuves-archive.service';

@Injectable()
export class ListPreuvesArchiveRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPreuvesArchiveService: ListPreuvesArchiveService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    preuvesArchiveErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listPreuvesArchiveInputSchema)
      .output(listPreuvesArchiveOutputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const result = await this.listPreuvesArchiveService.list({
          collectiviteId: input.collectiviteId,
          referentielId: input.referentielId,
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
