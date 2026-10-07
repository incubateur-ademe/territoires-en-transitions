import { Injectable } from '@nestjs/common';
import { CollectiviteCompetencesRepository } from '@tet/backend/collectivites/shared/collectivite-competences.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { COMPETENCE_BANATIC_SCOT } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import {
  GetDepotContextError,
  GetDepotContextErrorEnum,
} from './get-depot-context.errors';
import { GetDepotContextInput } from './get-depot-context.input';
import { DepotContext } from './get-depot-context.output';

/**
 * Ce que les écrans de dépôt doivent savoir de la collectivité elle-même, et
 * qui ne se lit pas sur la démarche : l'écran de démarrage pour décider quelles
 * questions poser, l'en-tête du dossier pour décider lesquelles restent
 * corrigeables.
 */
@Injectable()
export class GetDepotContextService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly competencesRepository: CollectiviteCompetencesRepository
  ) {}

  async getDepotContext(
    input: GetDepotContextInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DepotContext, GetDepotContextError>> {
    // Même permission que la création elle-même : ce contexte ne se lit que
    // par qui peut déposer.
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(GetDepotContextErrorEnum.UNAUTHORIZED);
    }

    const peutDeclarerScotAec = await this.competencesRepository.hasCompetence(
      input.collectiviteId,
      COMPETENCE_BANATIC_SCOT,
      tx
    );

    return success({ peutDeclarerScotAec });
  }
}
