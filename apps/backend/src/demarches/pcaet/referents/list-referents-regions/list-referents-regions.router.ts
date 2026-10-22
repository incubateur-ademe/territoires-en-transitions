import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getReferentsAccessInputSchema } from '../get-referents-access/get-referents-access.input';
import { referentsPcaetErrorConfig } from '../referents-pcaet.errors';
import { ListReferentsRegionsService } from './list-referents-regions.service';

@Injectable()
export class ListReferentsRegionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listReferentsRegionsService: ListReferentsRegionsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    referentsPcaetErrorConfig
  );

  router = this.trpc.router({
    listRegions: this.trpc.authedProcedure
      .input(getReferentsAccessInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listReferentsRegionsService.listRegions(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
