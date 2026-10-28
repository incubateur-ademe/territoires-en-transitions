import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { isPriorisationAvailable } from '@tet/domain/collectivites';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { EnjeuPertinencesRepositories } from '../enjeu-pertinences.repositories';
import {
  PertinenceLeviersErrorEnum,
  type PertinenceLeviersError,
} from '../pertinence-leviers.errors';
import { ListPertinencesLeviersInput } from './list-pertinences-leviers.input';
import { PertinencesLeviers } from './list-pertinences-leviers.output';

@Injectable()
export class ListPertinencesLeviersService {
  constructor(
    private readonly permissions: PermissionService,
    private readonly collectivites: CollectivitesService,
    private readonly enjeuPertinencesRepositories: EnjeuPertinencesRepositories
  ) {}

  async listPertinences(
    { collectiviteId, enjeu }: ListPertinencesLeviersInput,
    { user }: ServiceSecondArg
  ): Promise<Result<PertinencesLeviers, PertinenceLeviersError>> {
    const { collectivite } =
      await this.collectivites.getCollectivite(collectiviteId);
    const readCollectiviteOperation = collectivite.accesRestreint
      ? PermissionOperationEnum['COLLECTIVITES.READ_CONFIDENTIEL']
      : PermissionOperationEnum['COLLECTIVITES.READ'];
    const permissionResult = await this.permissions.isAllowed(
      user,
      readCollectiviteOperation,
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!permissionResult.success) {
      return failure(PertinenceLeviersErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const priorisationPermissionResult = await this.permissions.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.PRIORISATION.READ'],
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
    if (!priorisationPermissionResult.success) {
      return failure(PertinenceLeviersErrorEnum.UNAUTHORIZED);
    }

    if (!isPriorisationAvailable(collectivite.type)) {
      return failure(PertinenceLeviersErrorEnum.PRIORISATION_NOT_AVAILABLE);
    }

    const pertinencesResult = await this.enjeuPertinencesRepositories
      .pertinencesOf(enjeu)
      .list(collectiviteId);
    if (!pertinencesResult.success) {
      return failure(pertinencesResult.error);
    }

    return success({ collectiviteId, pertinences: pertinencesResult.data });
  }
}
