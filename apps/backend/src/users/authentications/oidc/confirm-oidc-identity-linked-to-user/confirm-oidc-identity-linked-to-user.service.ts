import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { oidcClaimsSchema } from '../oidc.models';
import { utilisateurIdentiteOidcInvitationTable } from '../models/utilisateur-identite-oidc-invitation.table';
import { LinkOidcIdentityToUserService } from '../link-oidc-identity-to-user/link-oidc-identity-to-user.service';
import { hashOidcInvitationToken } from '../oidc-invitation-token.utils';
import { ConfirmOidcIdentityLinkedToUserError } from './confirm-oidc-identity-linked-to-user.errors';

export type ConfirmOidcIdentityLinkedToUserResult = {
  statut: 'rattachement-confirme';
};

/**
 * Confirmation du fallback « mot de passe oublié » (cas 3-Oui) : lien
 * cliqué depuis l'email envoyé à l'ANCIEN compte. Les claims ProConnect
 * figés au moment de la demande (`utilisateur_identite_oidc_invitation.claims`) sont
 * réutilisés tels quels — pas besoin d'un nouveau ticket, la preuve de
 * possession de l'ancien compte vient d'avoir lieu (clic sur le lien reçu à
 * cette adresse).
 *
 * Décision : aucune session n'est émise ici — celui qui clique n'est pas
 * forcément la même machine/navigateur que la session ProConnect en cours.
 * Le front invite simplement à se reconnecter via ProConnect (cas 1 ensuite,
 * `sub` désormais connu).
 */
@Injectable()
export class ConfirmOidcIdentityLinkedToUserService {
  private readonly logger = new Logger(
    ConfirmOidcIdentityLinkedToUserService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly transactionManager: TransactionManager,
    private readonly rattacherIdentiteService: LinkOidcIdentityToUserService
  ) {}

  async confirmIdentityLinkedToUser(
    token: string
  ): Promise<
    Result<ConfirmOidcIdentityLinkedToUserResult, ConfirmOidcIdentityLinkedToUserError>
  > {
    const tokenHash = hashOidcInvitationToken(token);

    const [demande] = await this.databaseService.db
      .select()
      .from(utilisateurIdentiteOidcInvitationTable)
      .where(eq(utilisateurIdentiteOidcInvitationTable.tokenHash, tokenHash))
      .limit(1);

    if (!demande) {
      return failure('TOKEN_INVALIDE');
    }

    // Usage unique : une demande déjà confirmée ne peut pas l'être une
    // deuxième fois — traité comme un token invalide (pas d'info sur le
    // pourquoi, cohérent avec l'anti-énumération du fallback).
    if (demande.confirmedAt !== null) {
      this.logger.warn(
        `Confirmation de rattachement refusée : demande ${demande.id} déjà confirmée (usage unique)`
      );
      return failure('TOKEN_INVALIDE');
    }

    if (new Date(demande.expiresAt).getTime() <= Date.now()) {
      this.logger.warn(
        `Confirmation de rattachement refusée : demande ${demande.id} expirée`
      );
      return failure('TOKEN_EXPIRE');
    }

    const claims = oidcClaimsSchema.safeParse(demande.claims);
    if (!claims.success) {
      this.logger.error(
        `Confirmation de rattachement impossible : claims figés invalides pour la demande ${demande.id}`
      );
      return failure('TOKEN_INVALIDE');
    }

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      ConfirmOidcIdentityLinkedToUserError
    >(async (tx) => {
      // Consommation ATOMIQUE du token (usage unique fiable) : seul le premier
      // à passer `confirmed_at IS NULL → now()` gagne. Deux clics concurrents
      // qui ont tous deux franchi le pré-check ci-dessus ne peuvent donc pas
      // rattacher deux fois (TOCTOU) — le perdant obtient 0 ligne.
      const consomme = await tx
        .update(utilisateurIdentiteOidcInvitationTable)
        .set({ confirmedAt: sql`now()` })
        .where(
          and(
            eq(utilisateurIdentiteOidcInvitationTable.id, demande.id),
            isNull(utilisateurIdentiteOidcInvitationTable.confirmedAt)
          )
        )
        .returning({ id: utilisateurIdentiteOidcInvitationTable.id });

      if (consomme.length === 0) {
        return failure('TOKEN_INVALIDE');
      }

      // Garde-fous partagés (anti-vol si le sub a été lié ailleurs, compte
      // supprimé) — évite aussi la violation opaque de la PK (provider, sub).
      // Un échec ici annule la transaction → `confirmed_at` est restauré et le
      // token redevient utilisable.
      const rattachement =
        await this.rattacherIdentiteService.rattacherAvecGardeFous(
          demande.provider,
          demande.userId,
          claims.data,
          tx
        );
      if (!rattachement.success) {
        return failure(rattachement.error);
      }

      return success(undefined);
    });

    if (!transactionResult.success) {
      const erreur = transactionResult.error;
      const erreursMetier: ConfirmOidcIdentityLinkedToUserError[] = [
        'TOKEN_INVALIDE',
        'TOKEN_EXPIRE',
        'IDENTITE_DEJA_LIEE_AILLEURS',
        'COMPTE_SUPPRIME',
      ];
      if (!erreursMetier.includes(erreur)) {
        this.logger.error(
          `Echec de confirmation du rattachement (demande ${demande.id}): ${erreur}`
        );
      }
      // Erreurs métier remontées telles quelles ; tout autre échec (exception
      // DB) → DATABASE_ERROR (ne pas laisser fuiter un objet Error comme code).
      return failure(
        erreursMetier.includes(erreur) ? erreur : 'DATABASE_ERROR'
      );
    }

    this.logger.log(
      `Rattachement ${demande.provider} confirmé pour le compte ${demande.userId} (fallback mot de passe oublié, U5)`
    );

    return success({ statut: 'rattachement-confirme' });
  }
}
