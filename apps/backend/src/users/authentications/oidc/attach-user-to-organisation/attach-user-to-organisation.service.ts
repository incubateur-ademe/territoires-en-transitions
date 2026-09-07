import { Injectable, Logger } from '@nestjs/common';
import { UpdateUserRoleService } from '@tet/backend/users/authorizations/update-user-role/update-user-role.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  canAutoAttachEmail,
  isAutoAttachableType,
} from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { GetCollectiviteBySiretService } from '../get-collectivite-by-siret/get-collectivite-by-siret.service';
import { OidcClaims, OidcProvider } from '../oidc.models';
import {
  AttachUserToOrganisationError,
  AttachUserToOrganisationErrorEnum,
} from './attach-user-to-organisation.errors';

/**
 * Le résultat, dit du point de vue de l'appelant : soit un service à annoncer,
 * soit rien à faire. `raison` n'existe que pour le journal — aucun appelant ne
 * s'y branche, et l'utilisateur n'en voit jamais rien.
 */
export type AutoAttachmentOutcome =
  | { statut: 'rattache'; collectiviteId: number; nom: string }
  | { statut: 'aucun'; raison: AutoAttachmentRefus };

type AutoAttachmentRefus =
  | 'sans-siret'
  | 'organisation-inconnue'
  | 'type-non-rattachable'
  | 'domaine-email-refuse'
  | 'droit-deja-connu';

/**
 * Le rattachement automatique d'un agent à son service, sur la seule foi de son
 * identité.
 *
 * Un agent d'un service de l'État n'avait aucun moyen d'entrer : le parcours
 * « rejoindre une collectivité » refuse ces structures, et l'import des membres
 * n'est pas livré. Or l'organisation que l'agent choisit chez son fournisseur
 * d'identité **fait foi** — elle vaut mieux qu'un formulaire, et personne n'a
 * besoin de l'inviter.
 *
 * Quatre conditions, toutes nécessaires :
 *
 * 1. le jeton porte un SIRET ;
 * 2. ce SIRET désigne une collectivité, et une seule ;
 * 3. son type se rejoint par identité (`isAutoAttachableType`) — une commune
 *    reste sur le parcours d'invitation ;
 * 4. l'adresse de l'agent porte le domaine exigé par cet employeur, là où l'un
 *    est déclaré (`canAutoAttachEmail`).
 *
 * La quatrième est volontairement redondante avec la deuxième. Elle vaut pour le
 * jour où le fournisseur d'identité se tromperait d'organisation : c'est arrivé
 * en août 2026, quand MonCompteAdeme renvoyait le SIRET du siège de l'ADEME au
 * lieu de celui du service choisi. Ce SIRET désigne un service à périmètre
 * national, destinataire de **toute** transmission PCAET — la même erreur y
 * ferait entrer n'importe qui, et le domaine de messagerie est ce qui l'arrête.
 *
 * Le rattachement est **idempotent** et ne réveille rien : il n'agit que s'il
 * n'existe aucune ligne de droit pour ce couple, active ou non. Un droit retiré
 * par un administrateur laisse une ligne inactive derrière lui, et le voir
 * revenir à la connexion suivante annulerait sa décision.
 */
@Injectable()
export class AttachUserToOrganisationService {
  private readonly logger = new Logger(AttachUserToOrganisationService.name);

  constructor(
    private readonly getCollectiviteBySiretService: GetCollectiviteBySiretService,
    private readonly updateUserRoleService: UpdateUserRoleService,
    private readonly transactionManager: TransactionManager
  ) {}

  async attach(
    userId: string,
    provider: OidcProvider,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<Result<AutoAttachmentOutcome, AttachUserToOrganisationError>> {
    if (!claims.siret) {
      return success({ statut: 'aucun', raison: 'sans-siret' });
    }

    const collectivite = await this.getCollectiviteBySiretService.getBySiret(
      claims.siret,
      tx
    );

    // Le SIRET reçu et le service rapproché, tracés à chaque connexion : c'est
    // le seul endroit d'où l'on verra qu'un fournisseur d'identité s'est remis
    // à renvoyer la mauvaise organisation.
    this.logger.log(
      `Rattachement automatique (${provider}) : siret ${claims.siret} → ${
        collectivite
          ? `collectivité #${collectivite.collectiviteId} « ${collectivite.nom} » (${collectivite.type})`
          : 'aucune collectivité'
      }`
    );

    if (!collectivite) {
      return success({ statut: 'aucun', raison: 'organisation-inconnue' });
    }

    if (!isAutoAttachableType(collectivite.type)) {
      return success({ statut: 'aucun', raison: 'type-non-rattachable' });
    }

    if (
      !canAutoAttachEmail({ siren: collectivite.siren, email: claims.email })
    ) {
      this.logger.warn(
        `Rattachement automatique refusé : l'adresse de l'agent ne porte pas le domaine exigé par la collectivité #${collectivite.collectiviteId} (siren ${collectivite.siren})`
      );
      return success({ statut: 'aucun', raison: 'domaine-email-refuse' });
    }

    return this.transactionManager.executeSingle<
      AutoAttachmentOutcome,
      AttachUserToOrganisationError
    >(async (transaction) => {
      const [droitExistant] = await transaction
        .select({ id: utilisateurCollectiviteAccessTable.id })
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, userId),
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectivite.collectiviteId
            )
          )
        )
        .limit(1);

      if (droitExistant) {
        return success({ statut: 'aucun', raison: 'droit-deja-connu' });
      }

      try {
        await transaction.insert(utilisateurCollectiviteAccessTable).values({
          userId,
          collectiviteId: collectivite.collectiviteId,
          isActive: true,
          role: CollectiviteRole.EDITION,
          invitationId: null,
        });

        // Une identité prouvée vaut au moins une invitation par email, et le
        // compte non vérifié est traité à part par les gardes de collectivité.
        // C'est aussi ce que fait le chemin d'invitation, dans sa transaction.
        await this.updateUserRoleService.setIsVerified(
          userId,
          true,
          transaction
        );
      } catch (error) {
        return failure(
          AttachUserToOrganisationErrorEnum.ATTACH_ORGANISATION_ERROR,
          error instanceof Error ? error : undefined
        );
      }

      this.logger.log(
        `Compte ${userId} rattaché à la collectivité #${collectivite.collectiviteId} en ${CollectiviteRole.EDITION}`
      );

      return success({
        statut: 'rattache',
        collectiviteId: collectivite.collectiviteId,
        nom: collectivite.nom,
      });
    }, tx);
  }
}
