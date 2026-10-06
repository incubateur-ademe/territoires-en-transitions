import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CommonError,
  CommonErrorEnum,
} from '@tet/backend/utils/trpc/common-errors';
import { ResourceType } from '@tet/domain/users';
import { ListPlanFichesSecteursAVerifierInput } from './list-plan-fiches-secteurs-a-verifier.input';
import { ListPlanFichesSecteursAVerifierOutput } from './list-plan-fiches-secteurs-a-verifier.output';
import { ListPlanFichesSecteursAVerifierRepository } from './list-plan-fiches-secteurs-a-verifier.repository';

@Injectable()
export class ListPlanFichesSecteursAVerifierService {
  constructor(
    private readonly collectivitesService: CollectivitesService,
    private readonly permissionService: PermissionService,
    private readonly fichePermissionsService: FicheActionPermissionsService,
    private readonly listPlanFichesSecteursAVerifierRepository: ListPlanFichesSecteursAVerifierRepository
  ) {}

  async listFiches(
    { collectiviteId, planId }: ListPlanFichesSecteursAVerifierInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<ListPlanFichesSecteursAVerifierOutput, CommonError>> {
    const isPrivate = await this.collectivitesService.isPrivate(collectiviteId);
    const permission = await this.permissionService.isAllowed(
      user,
      isPrivate ? 'plans.read_confidentiel' : 'plans.read',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    const includeFichesRestreintes =
      await this.fichePermissionsService.hasReadFichePermission(
        { collectiviteId, restreint: true },
        user,
        true,
        tx
      );

    try {
      return success(
        await this.listPlanFichesSecteursAVerifierRepository.listFiches(
          { collectiviteId, planId, includeFichesRestreintes },
          tx
        )
      );
    } catch (error) {
      return failure(CommonErrorEnum.DATABASE_ERROR, error as Error);
    }
  }
}
