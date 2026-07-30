import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetOidcStatusService } from './get-oidc-status.service';

/**
 * Statut de la migration « connexion unifiée » MonCompteAdeme, exposé au front
 * (seul canal existant pour de la config runtime : `publicProcedure`, cf.
 * `listActiveProviders`).
 *
 * - `getStatus` (public) : provider ciblé + activé, pour les modales de
 *   connexion/création non authentifiées.
 * - `getUserStatus` (authed) : ajoute l'état de liaison du
 *   compte courant (pilote la bannière et la modale d'incitation).
 */
@Injectable()
export class GetOidcStatusRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly statutMigrationService: GetOidcStatusService
  ) {}

  router = this.trpc.router({
    getStatus: this.trpc.publicProcedure.query(() =>
      this.statutMigrationService.getStatutPublic()
    ),

    getUserStatus: this.trpc.authedProcedure.query(async ({ ctx: { user } }) =>
      this.statutMigrationService.getStatutUtilisateur(user.id)
    ),
  });
}
