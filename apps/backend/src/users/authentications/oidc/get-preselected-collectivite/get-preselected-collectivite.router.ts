import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetPreselectedCollectiviteService } from './get-preselected-collectivite.service';

/**
 * Pré-sélection de collectivité à la première inscription OIDC : l'écran
 * « rejoindre une collectivité » interroge cet endpoint pour pré-remplir le
 * sélecteur avec la collectivité correspondant au SIRET ProConnect de l'agent
 * (ou `null` si aucune correspondance unique).
 */
@Injectable()
export class GetPreselectedCollectiviteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly preselectionCollectiviteService: GetPreselectedCollectiviteService
  ) {}

  router = this.trpc.router({
    getPreselectedCollectivite: this.trpc.authedProcedure.query(
      async ({ ctx: { user } }) =>
        this.preselectionCollectiviteService.preselectionner(user.id)
    ),
  });
}
