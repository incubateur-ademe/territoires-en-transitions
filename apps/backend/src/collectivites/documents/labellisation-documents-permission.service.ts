import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';

@Injectable()
export class LabellisationDocumentsPermissionService {
  constructor(private readonly permissionService: PermissionService) {}

  async canMutate(
    { collectiviteId }: { collectiviteId: number },
    { user, tx }: ServiceSecondArg
  ): Promise<boolean> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['REFERENTIELS.LABELLISATIONS.MUTATE_DOCUMENTS'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );

    return permissionResult.success;
  }
}
