import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { demarchePcaetExportsErrorConfig } from './demarche-pcaet-exports.errors';
import {
  getDemarchePcaetExportUrlInputSchema,
  listDemarchePcaetExportsInputSchema,
} from './demarche-pcaet-exports.input';
import { GetDemarchePcaetExportUrlService } from './get-demarche-pcaet-export-url.service';
import { ListDemarchePcaetExportsService } from './list-demarche-pcaet-exports.service';

/**
 * `demarches.pcaet.exports` : les classeurs d'un dépôt, export figé ou export
 * du jour.
 */
@Injectable()
export class DemarchePcaetExportsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listService: ListDemarchePcaetExportsService,
    private readonly getUrlService: GetDemarchePcaetExportUrlService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    demarchePcaetExportsErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listDemarchePcaetExportsInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listService.list(input, { user: ctx.user });
        return this.getResultDataOrThrowError(result);
      }),

    getDownloadUrl: this.trpc.authedProcedure
      .input(getDemarchePcaetExportUrlInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getUrlService.getDownloadUrl(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
