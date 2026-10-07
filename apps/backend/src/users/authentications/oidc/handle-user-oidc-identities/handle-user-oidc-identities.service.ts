import { Injectable, Logger } from '@nestjs/common';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { and, eq, sql } from 'drizzle-orm';
import { OidcProvider } from '../oidc.models';
import { utilisateurIdentiteOidcTable } from '../models/utilisateur-identite-oidc.table';
import { OidcClientService } from '../oidc-client.service';
import { HandleUserOidcIdentitiesError } from './handle-user-oidc-identities.errors';

export type IdentiteLiee = {
  provider: OidcProvider;
  email: string;
  siret: string | null;
  /** Nom lisible de l'organisation (claim `organization_label`), si fourni. */
  organizationLabel: string | null;
  lastSignInAt: string;
};

/**
 * Liaison volontaire et déliaison des identités OIDC depuis le profil.
 * Générique par construction : `moncompteademe` y apparaît de lui-même dès
 * qu'il est activé, sans changement ici.
 */
@Injectable()
export class HandleUserOidcIdentitiesService {
  private readonly logger = new Logger(HandleUserOidcIdentitiesService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly oidcClientService: OidcClientService
  ) {}

  /** Providers OIDC actuellement activés — n'afficher que ceux-là côté profil. */
  listActiveProviders(): OidcProvider[] {
    return this.oidcClientService.getEnabledProviders();
  }

  async listUserIdentities(userId: string): Promise<IdentiteLiee[]> {
    return this.databaseService.db
      .select({
        provider: utilisateurIdentiteOidcTable.provider,
        email: utilisateurIdentiteOidcTable.email,
        siret: utilisateurIdentiteOidcTable.siret,
        // `organization_label` vit dans le jsonb `claims` (pas de colonne dédiée).
        organizationLabel: sql<
          string | null
        >`${utilisateurIdentiteOidcTable.claims}->>'organization_label'`,
        lastSignInAt: utilisateurIdentiteOidcTable.lastSignInAt,
      })
      .from(utilisateurIdentiteOidcTable)
      .where(eq(utilisateurIdentiteOidcTable.userId, userId));
  }

  /**
   * Garde-fou anti-lock-out : refuse la déliaison si c'est
   * le SEUL moyen de connexion restant — aucun mot de passe utilisable ET
   * aucune autre identité OIDC liée. Sinon, supprime simplement la ligne.
   */
  async unlinkIdentityFromUser(
    userId: string,
    provider: OidcProvider
  ): Promise<Result<void, HandleUserOidcIdentitiesError>> {
    return this.databaseService.db.transaction(async (tx) => {
      // Verrouille les identités OIDC de l'utilisateur (`FOR UPDATE`) pour
      // SÉRIALISER les déliaisons concurrentes : sans ce verrou, deux appels
      // simultanés (`proconnect` + `moncompteademe`) peuvent chacun voir l'autre
      // identité encore présente au moment du check, passer la garde, puis
      // supprimer leur ligne → compte sans aucun moyen de connexion (TOCTOU).
      const identites = await tx
        .select({ provider: utilisateurIdentiteOidcTable.provider })
        .from(utilisateurIdentiteOidcTable)
        .where(eq(utilisateurIdentiteOidcTable.userId, userId))
        .for('update');

      // Idempotent : l'identité a déjà été déliée (double soumission).
      if (!identites.some((i) => i.provider === provider)) {
        return success(undefined);
      }

      const aUneAutreIdentite = identites.some((i) => i.provider !== provider);
      if (!aUneAutreIdentite) {
        const [compte] = await tx
          .select({ encryptedPassword: authUsersTable.encryptedPassword })
          .from(authUsersTable)
          .where(eq(authUsersTable.id, userId))
          .limit(1);

        if (!compte?.encryptedPassword) {
          this.logger.warn(
            `Déliaison ${provider} refusée pour le compte ${userId} : dernier moyen de connexion (pas de mot de passe, pas d'autre identité liée)`
          );
          return failure('DELIAISON_REFUSEE_DERNIER_MOYEN_CONNEXION');
        }
      }

      await tx
        .delete(utilisateurIdentiteOidcTable)
        .where(
          and(
            eq(utilisateurIdentiteOidcTable.userId, userId),
            eq(utilisateurIdentiteOidcTable.provider, provider)
          )
        );

      this.logger.log(`Identité ${provider} déliée du compte ${userId}`);
      return success(undefined);
    });
  }
}
