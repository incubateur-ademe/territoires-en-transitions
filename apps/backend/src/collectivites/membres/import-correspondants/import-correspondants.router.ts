import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { importCorrespondantsErrorConfig } from './import-correspondants.errors';
import { importCorrespondantsInputSchema } from './import-correspondants.input';
import { ImportCorrespondantsService } from './import-correspondants.service';

@Injectable()
export class ImportCorrespondantsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly importCorrespondantsService: ImportCorrespondantsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    importCorrespondantsErrorConfig
  );

  router = this.trpc.router({
    // Service role : l'import est joué par un script d'administration, jamais
    // depuis l'interface.
    correspondants: this.trpc.serviceRoleProcedure
      .input(importCorrespondantsInputSchema)
      .mutation(async ({ input }) => {
        const result = await this.importCorrespondantsService.importer(input);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
