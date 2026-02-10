import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPreuvesAuditErrorConfig } from './list-preuves-audit.errors';
import { listPreuvesAuditInputSchema } from './list-preuves-audit.input';
import { listPreuvesLabellisationErrorConfig } from './list-preuves-labellisation.errors';
import { listPreuvesLabellisationInputSchema } from './list-preuves-labellisation.input';
import { ListPreuvesService } from './list-preuves.service';

@Injectable()
export class ListPreuvesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPreuvesService: ListPreuvesService
  ) {}

  router = this.trpc.router({
    listPreuvesLabellisation: this.trpc.authedProcedure
      .input(listPreuvesLabellisationInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const getResultDataOrThrowError = createTrpcErrorHandler(
          listPreuvesLabellisationErrorConfig
        );
        const result = await this.listPreuvesService.listPreuvesLabellisation(
          input,
          user
        );
        return getResultDataOrThrowError(result);
      }),
    listPreuvesAudit: this.trpc.authedProcedure
      .input(listPreuvesAuditInputSchema)
      .query(async ({ input, ctx: { user } }) => {
        const getResultDataOrThrowError = createTrpcErrorHandler(
          listPreuvesAuditErrorConfig
        );
        const result = await this.listPreuvesService.listPreuvesAudit(
          input,
          user
        );
        return getResultDataOrThrowError(result);
      }),
  });
}
