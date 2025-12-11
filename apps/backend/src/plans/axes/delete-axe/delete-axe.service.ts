import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { MethodResult } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum } from '@tet/domain/users';
import { GetAxeService } from '../get-axe/get-axe.service';
import { ListAxesService } from '../list-axes/list-axes.service';
import { DeleteAxeError, DeleteAxeErrorEnum } from './delete-axe.errors';
import { DeleteAxeInput } from './delete-axe.input';
import { DeleteAxeRepository } from './delete-axe.repository';

@Injectable()
export class DeleteAxeService {
  private readonly logger = new Logger(DeleteAxeService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly getAxeService: GetAxeService,
    private readonly listAxesService: ListAxesService,
    private readonly deleteAxeRepository: DeleteAxeRepository
  ) {}

  async deleteAxe(
    input: DeleteAxeInput,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<MethodResult<void, DeleteAxeError>> {
    // Récupérer l'axe pour obtenir le collectiviteId
    const axeResult = await this.getAxeService.getAxe(
      { axeId: input.axeId },
      user,
      tx
    );

    if (!axeResult.success) {
      return axeResult;
    }

    const collectiviteId = axeResult.data.collectiviteId;

    // Vérifier les permissions
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.MUTATE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      this.logger.log(
        `User ${user.id} is not allowed to delete axe ${input.axeId} for collectivité ${collectiviteId}`
      );
      return {
        success: false,
        error: DeleteAxeErrorEnum.UNAUTHORIZED,
      };
    }

    // Récupérer récursivement tous les axes et sous-axes à supprimer
    const listAxesResult = await this.listAxesService.listAxesRecursively(
      {
        parentId: input.axeId,
        collectiviteId,
      },
      user,
      tx
    );

    if (!listAxesResult.success) {
      return {
        success: false,
        error: DeleteAxeErrorEnum.SERVER_ERROR,
      };
    }

    // Extraire tous les IDs à supprimer
    const axesToDelete = listAxesResult.data;
    const axeIdsToDelete = axesToDelete.map((axe) => axe.id);

    this.logger.log(
      `Deleting axe ${input.axeId} and ${
        axesToDelete.length - 1
      } child axes (total: ${axeIdsToDelete.length})`
    );

    // Supprimer tous les axes
    const deleteResult = await this.deleteAxeRepository.deleteAxes(
      axeIdsToDelete,
      tx
    );

    if (!deleteResult.success) {
      return deleteResult;
    }

    return {
      success: true,
      data: undefined,
    };
  }
}
