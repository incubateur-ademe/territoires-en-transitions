import { Injectable, Logger } from '@nestjs/common';
import { UpdateUserRoleService } from '@tet/backend/users/authorizations/update-user-role/update-user-role.service';
import { UserPreferencesRepository } from '@tet/backend/users/preferences/user-preferences.repository';
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
import {
  OidcClaims,
  OidcProvider,
  RattachementAutomatique,
} from '../oidc.models';
import {
  AttachUserToOrganisationError,
  AttachUserToOrganisationErrorEnum,
} from './attach-user-to-organisation.errors';

/** `raison` ne sert qu'au journal : aucun appelant ne s'y branche. */
export type AutoAttachmentOutcome =
  | ({ statut: 'rattache' } & RattachementAutomatique)
  | { statut: 'aucun'; raison: AutoAttachmentRefus };

type AutoAttachmentRefus =
  | 'sans-siret'
  | 'organisation-inconnue'
  | 'type-non-rattachable'
  | 'domaine-email-refuse'
  | 'droit-deja-connu';

/**
 * Le rattachement d'un agent à son service, sur la foi de l'organisation que
 * son fournisseur d'identité atteste.
 *
 * Le verrou de domaine est volontairement redondant avec le rapprochement par
 * SIRET : en août 2026 MonCompteAdeme renvoyait le SIRET du siège de l'ADEME au
 * lieu du service choisi, et ce SIRET désigne un service à périmètre national,
 * destinataire de toute transmission PCAET.
 */
@Injectable()
export class AttachUserToOrganisationService {
  private readonly logger = new Logger(AttachUserToOrganisationService.name);

  constructor(
    private readonly getCollectiviteBySiretService: GetCollectiviteBySiretService,
    private readonly updateUserRoleService: UpdateUserRoleService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async attach(
    userId: string,
    provider: OidcProvider,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<Result<AutoAttachmentOutcome, AttachUserToOrganisationError>> {
    // Aucune exception ne doit sortir d'ici : un échec du rattachement ne fait
    // jamais échouer la connexion. `executeSingle` relance d'ailleurs
    // l'exception quand un `tx` lui est passé.
    try {
      return await this.rattacher(userId, provider, claims, tx);
    } catch (error) {
      this.logger.error(
        `Rattachement automatique du compte ${userId} interrompu par une exception`,
        error
      );
      return failure(
        AttachUserToOrganisationErrorEnum.ATTACH_ORGANISATION_ERROR,
        error instanceof Error ? error : undefined
      );
    }
  }

  private async rattacher(
    userId: string,
    provider: OidcProvider,
    claims: OidcClaims,
    tx?: Transaction
  ): Promise<Result<AutoAttachmentOutcome, AttachUserToOrganisationError>> {
    if (!claims.siret) {
      return this.refuser(userId, 'sans-siret');
    }

    const collectivite = await this.getCollectiviteBySiretService.getBySiret(
      claims.siret,
      tx
    );

    // Seule trace permettant de voir qu'un fournisseur d'identité s'est remis à
    // renvoyer la mauvaise organisation.
    this.logger.log(
      `Rattachement automatique (${provider}) : siret ${claims.siret} → ${
        collectivite
          ? `collectivité #${collectivite.collectiviteId} « ${collectivite.nom} » (${collectivite.type})`
          : 'aucune collectivité'
      }`
    );

    if (!collectivite) {
      return this.refuser(userId, 'organisation-inconnue');
    }

    if (!isAutoAttachableType(collectivite.type)) {
      return this.refuser(userId, 'type-non-rattachable');
    }

    if (
      !canAutoAttachEmail({ siren: collectivite.siren, email: claims.email })
    ) {
      return this.refuser(userId, 'domaine-email-refuse');
    }

    const resultat = await this.transactionManager.executeSingle<
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
        return this.refuser(userId, 'droit-deja-connu');
      }

      // Le `select` porte la règle — ne jamais réveiller un droit retiré ;
      // l'`on conflict` porte la course, deux callbacks concurrents le passant
      // tous deux.
      const [droitPose] = await transaction
        .insert(utilisateurCollectiviteAccessTable)
        .values({
          userId,
          collectiviteId: collectivite.collectiviteId,
          isActive: true,
          role: CollectiviteRole.EDITION,
          invitationId: null,
        })
        .onConflictDoNothing({
          target: [
            utilisateurCollectiviteAccessTable.userId,
            utilisateurCollectiviteAccessTable.collectiviteId,
          ],
        })
        .returning({ id: utilisateurCollectiviteAccessTable.id });

      if (!droitPose) {
        return this.refuser(userId, 'droit-deja-connu');
      }

      // Comme le chemin d'invitation : sans ça, les gardes de collectivité
      // traitent le compte à part.
      await this.updateUserRoleService.setIsVerified(userId, true, transaction);

      this.logger.log(
        `Compte ${userId} rattaché à la collectivité #${collectivite.collectiviteId} en ${CollectiviteRole.EDITION}`
      );

      return success({
        statut: 'rattache',
        collectiviteId: collectivite.collectiviteId,
        nom: collectivite.nom,
        type: collectivite.type,
      });
    }, tx);

    if (resultat.success && resultat.data.statut === 'rattache') {
      await this.annoncerLeService(userId, resultat.data.collectiviteId);
    }

    return resultat;
  }

  /** La raison au journal : sans elle, un rattachement absent est muet. */
  private refuser(
    userId: string,
    raison: AutoAttachmentRefus
  ): Result<AutoAttachmentOutcome, AttachUserToOrganisationError> {
    this.logger.log(
      `Rattachement automatique du compte ${userId} : aucun (${raison})`
    );
    return success({ statut: 'aucun', raison });
  }

  /**
   * Hors transaction, et sans conséquence si elle échoue : un écran d'accueil
   * manquant n'est pas un accès manquant, et le dépôt des préférences n'accepte
   * pas de `tx`.
   */
  private async annoncerLeService(
    userId: string,
    collectiviteId: number
  ): Promise<void> {
    const preferences =
      await this.userPreferencesRepository.updateUserPreferencesFlat(userId, {
        'oidc.autoAttachedCollectiviteId': collectiviteId,
      });

    if (!preferences.success) {
      this.logger.warn(
        `Le service #${collectiviteId} du compte ${userId} ne sera pas annoncé (${preferences.error}) : le rattachement, lui, est acquis`
      );
    }
  }
}
