import { Injectable } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq } from 'drizzle-orm';
import { OidcProvider } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { OidcClientService } from '../oidc-client.service';

/**
 * Provider ciblé par la migration « connexion unifiée » : on pousse la liaison
 * MonCompteAdeme spécifiquement (décision produit). ProConnect reste disponible
 * mais hors de ce parcours.
 */
export const PROVIDER_MIGRATION: OidcProvider = 'moncompteademe';

export type OidcStatus = {
  targetProvider: OidcProvider;
  /** Le provider ciblé est-il activé (config complète) ? Sinon rien ne s'affiche. */
  enabled: boolean;
};

export type OidcUserStatus = OidcStatus & {
  hasLinkedIdentity: boolean;
  /** Le compte dispose d'un mot de passe utilisable (sinon compte OIDC-only). */
  hasPassword: boolean;
};

/**
 * Source de vérité (serveur) de la migration « connexion unifiée » vers
 * MonCompteAdeme : provider activé et, pour un utilisateur donné, s'il a déjà
 * lié son compte et s'il dispose encore d'un mot de passe. Le pilotage
 * d'affichage (feature flag PostHog) reste côté client ; ce service ne fait que
 * fournir les données pour la bannière et la modale d'incitation.
 */
@Injectable()
export class GetOidcStatusService {
  constructor(
    private readonly oidcClientService: OidcClientService,
    private readonly databaseService: DatabaseService
  ) {}

  getStatutPublic(): OidcStatus {
    return {
      targetProvider: PROVIDER_MIGRATION,
      enabled:
        this.oidcClientService.getProviderConfig(PROVIDER_MIGRATION) !== null,
    };
  }

  async getStatutUtilisateur(
    userId: string
  ): Promise<OidcUserStatus> {
    const statut = this.getStatutPublic();

    const [identite] = await this.databaseService.db
      .select({ provider: utilisateurIdentiteOidcTable.provider })
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.userId, userId),
          eq(utilisateurIdentiteOidcTable.provider, PROVIDER_MIGRATION)
        )
      )
      .limit(1);

    // Présence d'un mot de passe utilisable (les comptes créés uniquement via
    // OIDC n'en ont pas) : conditionne l'affichage de la ligne « mot de passe »
    // côté profil pour ne pas montrer une méthode fantôme.
    const [compte] = await this.databaseService.db
      .select({ encryptedPassword: authUsersTable.encryptedPassword })
      .from(authUsersTable)
      .where(eq(authUsersTable.id, userId))
      .limit(1);

    return {
      ...statut,
      hasLinkedIdentity: !!identite,
      hasPassword: !!compte?.encryptedPassword,
    };
  }
}
