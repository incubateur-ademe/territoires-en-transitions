import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { uniq } from 'es-toolkit';
import {
  AnalysisJobErrorEnum,
  type AnalysisJobError,
} from '../analysis-job.errors';
import { EnjeuRepositories } from '../enjeu.repositories';
import { type LevierMobilisation } from '../mobilisation.repository';
import { GetMobilisationInput } from './get-mobilisation.input';
import {
  type LevierMobilisationOutput,
  type Mobilisation,
} from './get-mobilisation.output';

const countDistinctFiches = (ficheIds: number[]): number =>
  uniq(ficheIds).length;

const toLevierMobilisationOutput = ({
  levierId,
  volets,
}: LevierMobilisation): LevierMobilisationOutput => ({
  levierId,
  ficheCount: countDistinctFiches(volets.flatMap(({ ficheIds }) => ficheIds)),
  volets: volets.map(({ categorie, note, ficheIds }) => ({
    categorie,
    note,
    ficheCount: countDistinctFiches(ficheIds),
  })),
});

@Injectable()
export class GetMobilisationService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly collectivites: CollectivitesService,
    private readonly enjeuRepositories: EnjeuRepositories
  ) {}

  async getMobilisation(
    { collectiviteId, enjeu }: GetMobilisationInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<Mobilisation, AnalysisJobError>> {
    const isCollectivitePrivate = await this.collectivites.isPrivate(
      collectiviteId
    );
    const readFichesOperation = isCollectivitePrivate
      ? PermissionOperationEnum['PLANS.FICHES.READ_CONFIDENTIEL']
      : PermissionOperationEnum['PLANS.FICHES.READ'];
    const permissionResult = await this.permissions.isAllowed(
      user,
      readFichesOperation,
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(AnalysisJobErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const mobilisationResult = await this.enjeuRepositories
      .mobilisationOf(enjeu)
      .getMobilisation(collectiviteId);
    if (!mobilisationResult.success) {
      return failure(AnalysisJobErrorEnum.GET_MOBILISATION_ERROR);
    }

    return success({
      collectiviteId,
      leviers: mobilisationResult.data.map(toLevierMobilisationOutput),
    });
  }
}
