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
  GetDemarchePcaetError,
  GetDemarchePcaetErrorEnum,
} from './get-demarche-pcaet.errors';
import { GetDemarchePcaetInput } from './get-demarche-pcaet.input';
import { GetDemarchePcaetRepository } from './get-demarche-pcaet.repository';

@Injectable()
export class GetDemarchePcaetService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly documentsRepository: DemarcheDocumentsRepository
  ) {}

  async getDemarchePcaet(
    input: GetDemarchePcaetInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, GetDemarchePcaetError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(GetDemarchePcaetErrorEnum.UNAUTHORIZED);
    }

    const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
      input,
      tx
    );
    if (!getResult.success) {
      return getResult;
    }
    const documentsComplets = await this.documentsRepository.isDocumentsComplet(
      getResult.data,
      tx
    );
    const diagnosticComplet = await this.diagnosticService.isDiagnosticComplet(
      {
        demarcheId: getResult.data.id,
        collectiviteId: getResult.data.collectiviteId,
      },
      tx
    );
    return {
      success: true,
      data: this.guardsService.enrich(getResult.data, user, {
        documentsComplets,
        diagnosticComplet,
      }),
    };
  }
}
