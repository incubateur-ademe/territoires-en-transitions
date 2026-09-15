import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  ClassificationVoletsErrorEnum,
  type ClassificationVoletsError,
} from '../classification-volets.errors';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import { GetMobilisationInput } from './get-mobilisation.input';
import { Mobilisation } from './get-mobilisation.output';

@Injectable()
export class GetMobilisationService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly gridRepository: CollectiviteVoletGesRepository
  ) {}

  async getMobilisation(
    { collectiviteId }: GetMobilisationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<Mobilisation, ClassificationVoletsError>> {
    const permissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(ClassificationVoletsErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const gridResult = await this.gridRepository.getGrid(collectiviteId);
    if (!gridResult.success) {
      return failure(ClassificationVoletsErrorEnum.GET_JOB_ERROR);
    }

    return success({ collectiviteId, leviers: gridResult.data });
  }
}
