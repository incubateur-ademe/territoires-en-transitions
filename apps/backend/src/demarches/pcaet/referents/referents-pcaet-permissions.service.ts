import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { isDgec } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { ReferentsPcaetRepository } from './referents-pcaet.repository';

export type ReferentsPcaetAccess = { canRead: boolean; canMutate: boolean };

/**
 * Seule la DGEC désigne les référents PCAET. Les rôles ignorent le type de
 * collectivité : c'est l'identité de la collectivité qui fait la garde, le rôle
 * départage ensuite la lecture de l'édition.
 */
@Injectable()
export class ReferentsPcaetPermissionsService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly referentsRepository: ReferentsPcaetRepository
  ) {}

  async getAccess(
    dgecId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<ReferentsPcaetAccess> {
    const collectivite = await this.referentsRepository.getCollectivite(
      dgecId,
      tx
    );
    if (!collectivite || !isDgec(collectivite)) {
      return { canRead: false, canMutate: false };
    }

    // Un super admin passe par ses permissions de plateforme.
    const mutate = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: dgecId },
      tx
    );
    if (mutate.success) {
      return { canRead: true, canMutate: true };
    }

    const canRead = await this.referentsRepository.isMembreActif(
      user.id,
      dgecId,
      tx
    );
    return { canRead, canMutate: false };
  }
}
