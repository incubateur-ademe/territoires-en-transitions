import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import { ResourceType } from '@tet/domain/users';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { ListMembresService } from '../list-membres/list-membres.service';
import {
  MutateMembresErrorEnum,
  type MutateMembresError,
} from './mutate-membres.errors';
import {
  JoinAsMembreInput,
  RemoveMembreInput,
  UpdateConseillersReferentsInput,
  UpdateMembreInput,
} from './mutate-membres.input';
import { MutateMembresRepository } from './mutate-membres.repository';

@Injectable()
export class MutateMembresService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly repository: MutateMembresRepository,
    private readonly permissionsService: PermissionService,
    private readonly listMembresService: ListMembresService,
    private readonly transactionManager: TransactionManager
  ) {}

  async update(
    membres: UpdateMembreInput[],
    user: AuthenticatedUser
  ): Promise<Result<void[], MutateMembresError | CommonError>> {
    const results = await Promise.all(
      membres.map(async ({ collectiviteId, userId, role, ...other }) => {
        const unauthorizedFailure = failure(
          MutateMembresErrorEnum.UNAUTHORIZED
        );

        const isAdmin = (
          await this.permissionsService.isAllowed(
            user,
            'collectivites.membres.mutate',
            ResourceType.COLLECTIVITE,
            { collectiviteId }
          )
        ).success;

        // Sans droit admin : uniquement ses propres
        // fonction/detailsFonction/champIntervention (matrice: soi/oui),
        // jamais le rôle. Contrôlé avant toute écriture.
        if (!isAdmin && (userId !== user.id || role !== undefined)) {
          return unauthorizedFailure;
        }

        if (Object.values(other).some((v) => v !== undefined)) {
          // Self-update without admin rights: the user must already be an
          // active member of this collectivité before upserting, otherwise any
          // authenticated user could insert a ghost row into membreTable for a
          // collectivité they don't belong to (IDOR — TET-7360).
          if (!isAdmin) {
            const isMember = await this.listMembresService.isActiveMember({
              userId,
              collectiviteId,
            });
            if (!isMember) {
              return unauthorizedFailure;
            }
          }

          await this.repository.upsertMembreDetails({
            collectiviteId,
            userId,
            ...other,
          });
        }

        if (role !== undefined) {
          await this.repository.updateMembreRole({
            collectiviteId,
            userId,
            role,
          });
        }

        return success(undefined);
      })
    );

    return combineResults(results);
  }

  /**
   * Désigne les conseillers référents de la collectivité : `userIds` remplace
   * la liste. Seuls des membres actifs de fonction « conseiller » peuvent être
   * désignés ; tout ou rien.
   *
   * Les membres d'une autre fonction ne sont jamais modifiés : ils peuvent
   * s'être déclarés « personne référente » en rejoignant la collectivité, et
   * restent à ce titre contacts dans Recherches.
   */
  async updateConseillersReferents(
    { collectiviteId, userIds }: UpdateConseillersReferentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, MutateMembresError | CommonError>> {
    const permission = await this.permissionsService.isAllowed(
      user,
      'collectivites.membres.mutate_conseillers_referents',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success) {
      return failure(MutateMembresErrorEnum.UNAUTHORIZED);
    }

    const referentIds = [...new Set(userIds)];

    return this.transactionManager.executeSingle(async (tx) => {
      await this.repository.lockConseillersReferents(collectiviteId, tx);

      if (referentIds.length > 0) {
        const designes = await this.repository.setConseillersReferents(
          { collectiviteId, userIds: referentIds },
          tx
        );

        // Une cible refusée annule toute la transaction
        if (designes.length !== referentIds.length) {
          return failure(MutateMembresErrorEnum.MEMBER_NOT_FOUND);
        }
      }

      await this.repository.clearOtherConseillersReferents(
        { collectiviteId, userIds: referentIds },
        tx
      );

      return success(undefined);
    }, tx);
  }

  /**
   * Rattache l'utilisateur authentifié à une collectivité (parcours « rejoindre »),
   * uniquement s'il n'existe encore aucun membre actif (premier rattachement → admin).
   * Sinon : erreur — il faut être invité par un administrateur de la collectivité.
   */
  async join(
    input: JoinAsMembreInput,
    user: AuthenticatedUser
  ): Promise<Result<void, MutateMembresError>> {
    const collectivite = await this.repository.getCollectivite(
      input.collectiviteId
    );

    if (!collectivite) {
      return failure(MutateMembresErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    if (isServiceDeconcentre(collectivite.type)) {
      return failure(
        MutateMembresErrorEnum.SERVICE_DECONCENTRE_NON_REJOIGNABLE
      );
    }

    const alreadyActive = await this.listMembresService.isActiveMember({
      userId: user.id,
      collectiviteId: input.collectiviteId,
    });

    if (alreadyActive) {
      return failure(MutateMembresErrorEnum.ALREADY_ACTIVE_MEMBER);
    }

    let collectiviteHasActiveMembers = false;

    await this.databaseService.db.transaction(async (tx) => {
      const activeCount = await this.repository.countActiveMembresForUpdate(
        input.collectiviteId,
        tx
      );

      if (activeCount > 0) {
        collectiviteHasActiveMembers = true;
        return;
      }

      await this.repository.upsertAdminAccess(
        { collectiviteId: input.collectiviteId, userId: user.id },
        tx
      );
      await this.repository.upsertJoinedMembre(
        { ...input, userId: user.id },
        tx
      );
    });

    if (collectiviteHasActiveMembers) {
      return failure(MutateMembresErrorEnum.COLLECTIVITE_HAS_ACTIVE_MEMBERS);
    }

    return success(undefined);
  }

  /** Retire un membre de la collectivité (désactive le droit et supprime les infos membre) */
  async remove(
    { collectiviteId, userId }: RemoveMembreInput,
    user: AuthenticatedUser
  ): Promise<Result<void, MutateMembresError>> {
    if (user.id !== userId) {
      await this.permissionsService.assertAllowed(
        user,
        'collectivites.membres.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
    }

    const existing = await this.repository.getMembreAccess({
      collectiviteId,
      userId,
    });

    if (!existing) {
      return failure(MutateMembresErrorEnum.MEMBER_NOT_FOUND);
    }

    await this.databaseService.db.transaction(async (tx) => {
      await this.repository.deactivateMembreAccess(
        { collectiviteId, userId },
        tx
      );
      await this.repository.deleteMembre({ collectiviteId, userId }, tx);
    });

    return success(undefined);
  }
}
