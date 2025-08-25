import { importCollectiviteRelationsRequestSchema } from '@/backend/collectivites/import-collectivite-relations/import-collectivite-relations.request';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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
      .mutation(async ({ input, ctx }) => {
        return this.service.importEpciCommunesRelations(input?.useDatagouvFile);
      }),
    importSyndicatEpciRelations: this.trpc.serviceRoleProcedure
      .input(importCollectiviteRelationsRequestSchema)
      .mutation(async ({ input, ctx }) => {
        return this.service.importSyndicatEpciRelations(input?.useDatagouvFile);
      }),
  });
}
