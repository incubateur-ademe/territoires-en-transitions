import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { importTrajectoireSnbc3ErrorConfig } from './import-trajectoire-snbc3.errors';
import { importTrajectoireSnbc3InputSchema } from './import-trajectoire-snbc3.input';
import { EnqueueImportTrajectoireSnbc3Service } from './enqueue-import-trajectoire-snbc3.service';

@Injectable()
export class ImportTrajectoireSnbc3Router {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    importTrajectoireSnbc3ErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: EnqueueImportTrajectoireSnbc3Service
  ) {}

  router = this.trpc.router({
    /**
     * Met en file l'import d'une release du dépôt snbc3 comme source
     * `snbc3`, et renvoie l'identifiant du job.
     *
     * Appelée à la main à chaque livraison (voir le README du dossier).
     * Réservée au rôle de service : elle remplace les valeurs de toutes les
     * collectivités.
     */
    import: this.trpc.serviceRoleProcedure
      .input(importTrajectoireSnbc3InputSchema)
      .mutation(async ({ input }) =>
        this.getResultDataOrThrowError(await this.service.enqueue(input))
      ),
  });
}
