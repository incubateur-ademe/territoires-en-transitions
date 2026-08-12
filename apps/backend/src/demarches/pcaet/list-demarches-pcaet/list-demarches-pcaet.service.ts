import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import type { DemarchePcaet } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
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
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
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
      listResult.data.map(async (demarche) => {
        if (!this.guardsService.needsCompletionInputs(demarche.status)) {
          return this.guardsService.enrich(demarche, user);
        }
        return this.guardsService.enrich(demarche, user, {
          documentsComplets: await this.documentsRepository.isDocumentsComplet(
            demarche,
            tx
          ),
          diagnosticComplet: await this.diagnosticService.isDiagnosticComplet(
            { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
            tx
          ),
        });
      })
    );
    return { success: true, data };
  }
}
