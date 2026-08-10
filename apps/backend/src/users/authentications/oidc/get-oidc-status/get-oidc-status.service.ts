import { Injectable } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { and, eq } from 'drizzle-orm';
import { OidcProvider } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { OidcClientService } from '../oidc-client.service';

/**
 * Ordre de préférence du provider mis en avant (liaison « connexion unifiée »
 * et création de compte) : MonCompteAdeme d'abord — c'est un Keycloak adossé à
 * ProConnect, qui porte en plus le compte ADEME — puis ProConnect en direct.
 * Le premier provider effectivement configuré gagne ; si aucun ne l'est, le
 * parcours OIDC est inerte et rien ne s'affiche.
 */
export const OIDC_PROVIDER_PREFERENCE: OidcProvider[] = [
  'moncompteademe',
  'proconnect',
];

export type OidcStatus = {
  /** Provider mis en avant, ou `null` si aucun n'est configuré. */
  targetProvider: OidcProvider | null;
  /** Le provider ciblé est-il activé (config complète) ? Sinon rien ne s'affiche. */
  enabled: boolean;
};

export type OidcUserStatus = OidcStatus & {
  hasLinkedIdentity: boolean;
  /** Le compte dispose d'un mot de passe utilisable (sinon compte OIDC-only). */
  hasPassword: boolean;
};

/**
 * Source de vérité (serveur) du parcours OIDC mis en avant : quel provider est
 * activé et, pour un utilisateur donné, s'il a déjà lié son compte et s'il
 * dispose encore d'un mot de passe. Alimente la bannière et la modale
 * d'incitation, le bloc « recommandé » des écrans de connexion et la
 * redirection de `/signup` vers la création de compte OIDC.
 */
@Injectable()
export class GetOidcStatusService {
  constructor(
    private readonly oidcClientService: OidcClientService,
    private readonly databaseService: DatabaseService
  ) {}

  getStatutPublic(): OidcStatus {
    const targetProvider =
      OIDC_PROVIDER_PREFERENCE.find(
        (provider) => this.oidcClientService.getProviderConfig(provider) !== null
      ) ?? null;

    return {
      targetProvider,
      enabled: targetProvider !== null,
    };
  }

  async getStatutUtilisateur(userId: string): Promise<OidcUserStatus> {
    const statut = this.getStatutPublic();

    // Présence d'un mot de passe utilisable (les comptes créés uniquement via
    // OIDC n'en ont pas) : conditionne l'affichage de la ligne « mot de passe »
    // côté profil pour ne pas montrer une méthode fantôme.
    const [compte] = await this.databaseService.db
      .select({ encryptedPassword: authUsersTable.encryptedPassword })
      .from(authUsersTable)
      .where(eq(authUsersTable.id, userId))
      .limit(1);

    const hasPassword = !!compte?.encryptedPassword;

    // Aucun provider configuré : rien à lier, on évite une requête inutile.
    if (!statut.targetProvider) {
      return { ...statut, hasLinkedIdentity: false, hasPassword };
    }

    const [identite] = await this.databaseService.db
      .select({ provider: utilisateurIdentiteOidcTable.provider })
      .from(utilisateurIdentiteOidcTable)
      .where(
        and(
          eq(utilisateurIdentiteOidcTable.userId, userId),
          eq(utilisateurIdentiteOidcTable.provider, statut.targetProvider)
        )
      )
      .limit(1);

    return {
      ...statut,
      hasLinkedIdentity: !!identite,
      hasPassword,
    };
  }
}
