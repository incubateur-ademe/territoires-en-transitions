import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { ImportPerimetresEpciService } from './import-perimetres-epci.service';

@Injectable()
export class ImportPerimetresEpciRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ImportPerimetresEpciService
  ) {}

  router = this.trpc.router({
    /**
     * Rejoue le calcul des périmètres secondaires des EPCI depuis BANATIC.
     *
     * Appelée une fois par an par le scheduler de `apps/tools`, et à la main
     * quand la source publie un nouveau millésime. Réservée au rôle de service :
     * elle réécrit des données de référence dont dépendent des droits d'accès.
     */
    importPerimetresEpci: this.trpc.serviceRoleProcedure
      .input(
        z
          .object({
            /**
             * Faux pour lire le fichier committé plutôt que data.gouv — ce que
             * font les tests, qui ne doivent dépendre d'aucun réseau.
             */
            depuisDatagouv: z.boolean().optional(),
          })
          .optional()
      )
      .mutation(({ input }) =>
        this.service.importPerimetresEpci(input?.depuisDatagouv ?? true)
      ),
  });
}
