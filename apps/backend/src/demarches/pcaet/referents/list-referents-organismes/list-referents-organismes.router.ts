import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { referentsPcaetErrorConfig } from '../referents-pcaet.errors';
import { listReferentsOrganismesInputSchema } from './list-referents-organismes.input';
import { ListReferentsOrganismesService } from './list-referents-organismes.service';

@Injectable()
export class ListReferentsOrganismesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listReferentsOrganismesService: ListReferentsOrganismesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    referentsPcaetErrorConfig
  );

  router = this.trpc.router({
    listOrganismes: this.trpc.authedProcedure
      .input(listReferentsOrganismesInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listReferentsOrganismesService.listOrganismes(
          input,
          {
            user: ctx.user,
          }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
