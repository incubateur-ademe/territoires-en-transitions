import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  GetDiagnosticError,
  GetDiagnosticErrorEnum,
} from './get-diagnostic.errors';
import { GetDiagnosticInput } from './get-diagnostic.input';

@Injectable()
export class GetDiagnosticService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async getDiagnostic(
    input: GetDiagnosticInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, GetDiagnosticError>> {
    for (const operation of [
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      PermissionOperationEnum['INDICATEURS.VALEURS.READ'],
    ]) {
      const permissionResult = await this.permissionService.isAllowed(
        user,
        operation,
        ResourceType.COLLECTIVITE,
        { collectiviteId: input.collectiviteId },
        tx
      );
      if (!permissionResult.success) {
        return failure(GetDiagnosticErrorEnum.UNAUTHORIZED);
      }
    }

    const ref = await this.refRepository.findRef(input, undefined, tx);
    if (!ref) {
      return failure(GetDiagnosticErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }

    return success(await this.diagnosticService.loadPayload(input, tx));
  }
}
