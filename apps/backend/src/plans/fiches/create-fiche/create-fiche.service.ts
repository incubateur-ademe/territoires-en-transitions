import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  FicheActionRepository,
  FicheActionWriteError,
} from '@tet/backend/plans/fiches/fiche-action.repository';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  Fiche,
  FicheCreate,
  ficheSchemaCreate,
  FicheWithRelations,
} from '@tet/domain/plans';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { UpdateFicheInput } from '../update-fiche/update-fiche.input';
import UpdateFicheService from '../update-fiche/update-fiche.service';
import { CreateFicheResult } from './create-fiche.result';
import { FicheCreateAuthorization } from './fiche-create-authorization';

type CreateFicheWithAuthorizationError =
  | FicheActionWriteError
  | 'AUTHORIZATION_SCOPE_MISMATCH'
  | 'PARENT_NOT_FOUND'
  | 'PARENT_COLLECTIVITE_MISMATCH';

@Injectable()
export class CreateFicheService {
  private readonly logger = new Logger(CreateFicheService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly ficheActionPermissionsService: FicheActionPermissionsService,
    private readonly updateFicheService: UpdateFicheService,
    private readonly ficheActionRepository: FicheActionRepository,
    private readonly transactionManager: TransactionManager
  ) {}

  async createFiche(
    fiche: FicheCreate,
    {
      ficheFields,
      tx,
      user,
    }: {
      ficheFields?: Omit<UpdateFicheInput, 'id'>;
      tx?: Transaction;
      user: AuthenticatedUser;
    }
  ): Promise<CreateFicheResult<Fiche | FicheWithRelations>> {
    this.logger.log(
      `Création de la fiche ${fiche.titre} pour la collectivité ${fiche.collectiviteId}`
    );

    await this.assertCanCreateFiche(fiche, user, tx);

    const validation = ficheSchemaCreate.safeParse(fiche);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues.map((issue) => issue.message).join(', '),
      };
    }

    const hasFieldsToApply =
      ficheFields !== undefined &&
      Object.values(ficheFields).some((v) => v !== undefined);

    return this.transactionManager.executeSingle<
      Fiche | FicheWithRelations,
      string
    >(async (transaction) => {
      const createResult = await this.ficheActionRepository.applyCreate({
        fiche,
        user,
        tx: transaction,
      });
      if (!createResult.success) {
        return failure(`Échec de création de la fiche: ${createResult.error}`);
      }

      if (!hasFieldsToApply) {
        return success(createResult.data.fiche);
      }

      const updateResult = await this.updateFicheService.updateFiche({
        ficheId: createResult.data.id,
        ficheFields,
        user,
        tx: transaction,
      });
      if (!updateResult.success) {
        return failure(
          `Échec de la mise à jour de la fiche: ${updateResult.error}`
        );
      }
      return success(updateResult.data);
    }, tx);
  }

  async createFicheWithAuthorization({
    authorization,
    fiche,
    ficheFields,
    tx,
  }: {
    authorization: FicheCreateAuthorization;
    fiche: FicheCreate;
    ficheFields?: UpdateFicheInput;
    tx: Transaction;
  }): Promise<Result<{ id: number }, CreateFicheWithAuthorizationError>> {
    if (fiche.collectiviteId !== authorization.collectiviteId) {
      return failure('AUTHORIZATION_SCOPE_MISMATCH');
    }

    if (fiche.parentId !== null && fiche.parentId !== undefined) {
      const parent = await this.ficheActionPermissionsService.getFicheFromId(
        fiche.parentId,
        tx
      );
      if (!parent) {
        return failure('PARENT_NOT_FOUND');
      }
      if (parent.collectiviteId !== authorization.collectiviteId) {
        return failure('PARENT_COLLECTIVITE_MISMATCH');
      }
    }

    const result = await this.ficheActionRepository.applyCreate({
      fiche,
      ficheFields,
      user: authorization.user,
      tx,
    });
    if (!result.success) return result;
    return success({ id: result.data.id });
  }

  /**
   * Pour une sous-action, on hérite du droit d'écriture du parent (couvre
   * les contributeurs pilotes via `plans.fiches.update_piloted_by_me`)
   * plutôt que d'exiger `plans.fiches.create` au niveau collectivité.
   */
  private async assertCanCreateFiche(
    fiche: FicheCreate,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<void> {
    if (!user) return;

    const { parentId } = fiche;
    const isSousAction = parentId !== null && parentId !== undefined;

    if (!isSousAction) {
      await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['PLANS.FICHES.CREATE'],
        ResourceType.COLLECTIVITE,
        fiche.collectiviteId,
        false,
        tx
      );
      return;
    }

    await this.ficheActionPermissionsService.canWriteFiche(parentId, user, tx);

    const parentFiche = await this.ficheActionPermissionsService.getFicheFromId(
      parentId,
      tx
    );
    const isCrossCollectivite =
      parentFiche !== null &&
      parentFiche.collectiviteId !== fiche.collectiviteId;
    if (isCrossCollectivite) {
      throw new ForbiddenException(
        `La sous-action doit appartenir à la même collectivité que la fiche parente ${parentId}`
      );
    }
  }
}
