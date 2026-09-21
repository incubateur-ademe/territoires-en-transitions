import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { CollectiviteVoletGesRepository } from '../collectivite-volet-ges.repository';
import { MobilisationRepository } from '../mobilisation.repository';
import { GetMobilisationInput } from './get-mobilisation.input';
import { Mobilisation } from './get-mobilisation.output';

@Injectable()
export class GetMobilisationService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly collectiviteVoletGesRepository: CollectiviteVoletGesRepository
  ) {}

  private readonly mobilisationsByEnjeu: Record<Enjeu, MobilisationRepository> =
    {
      ges: this.collectiviteVoletGesRepository,
    };

  async getMobilisation(
    { collectiviteId, enjeu }: GetMobilisationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<Mobilisation, AnalysisJobError>> {
    const permissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.READ_CONFIDENTIEL'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const mobilisationResult = await this.mobilisationsByEnjeu[
      enjeu
    ].getMobilisation(collectiviteId);
    if (!mobilisationResult.success) {
      return failure(AnalysisJobErrorEnum.GET_MOBILISATION_ERROR);
    }

    return success({ collectiviteId, leviers: mobilisationResult.data });
  }
}
