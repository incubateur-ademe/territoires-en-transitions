import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import type { DemarchePcaet } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import {
  ListDemarchesPcaetError,
  ListDemarchesPcaetErrorEnum,
} from './list-demarches-pcaet.errors';
import { ListDemarchesPcaetInput } from './list-demarches-pcaet.input';
import { ListDemarchesPcaetRepository } from './list-demarches-pcaet.repository';

@Injectable()
export class ListDemarchesPcaetService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly listDemarchesPcaetRepository: ListDemarchesPcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService
  ) {}

  async listDemarchesPcaet(
    input: ListDemarchesPcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet[], ListDemarchesPcaetError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(ListDemarchesPcaetErrorEnum.UNAUTHORIZED);
    }

    const listResult =
      await this.listDemarchesPcaetRepository.listDemarchesPcaet(input, tx);
    if (!listResult.success) {
      return listResult;
    }
    // Le workflow dit quels guards comptent pour chaque statut : seule une
    // démarche en élaboration coûte les lectures de complétude, et l'index
    // unique partiel en garantit au plus une par collectivité et par type.
    return {
      success: true,
      data: await this.guardsService.enrichAll(listResult.data, user, tx),
    };
  }
}
