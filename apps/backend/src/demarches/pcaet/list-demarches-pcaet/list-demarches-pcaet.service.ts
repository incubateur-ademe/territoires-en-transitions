import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import type { DemarchePcaet } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
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
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly documentsRepository: DemarcheDocumentsRepository
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
    // `dossierComplet` ne pèse que sur une démarche en élaboration : l'index
    // unique partiel en garantit au plus une par collectivité et par type,
    // donc au plus une lecture supplémentaire ici.
    const data = await Promise.all(
      listResult.data.map(async (demarche) =>
        this.guardsService.enrich(demarche, user, {
          dossierComplet: await this.documentsRepository.isDossierComplet(
            demarche,
            tx
          ),
        })
      )
    );
    return { success: true, data };
  }
}
