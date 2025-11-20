import { Injectable } from '@nestjs/common';
import { importCollectiviteRelationsRequestSchema } from '@tet/backend/collectivites/import-collectivite-relations/import-collectivite-relations.request';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ImportCollectiviteRelationsService } from './import-collectivite-relations.service';

@Injectable()
export class ImportCollectiviteRelationsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportCollectiviteRelationsService
  ) {}

  router = this.trpc.router({
    importEpciCommunesRelations: this.trpc.serviceRoleProcedure
      .input(importCollectiviteRelationsRequestSchema)
      .mutation(async ({ input }) => {
        return this.service.importEpciCommunesRelations(input?.useDatagouvFile);
      }),
    importSyndicatEpciRelations: this.trpc.serviceRoleProcedure
      .input(importCollectiviteRelationsRequestSchema)
      .mutation(async ({ input }) => {
        return this.service.importSyndicatEpciRelations(input?.useDatagouvFile);
      }),
  });
}
