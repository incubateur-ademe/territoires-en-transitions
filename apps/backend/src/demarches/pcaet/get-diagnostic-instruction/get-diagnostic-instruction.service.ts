import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { type PcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DepotPermissionsService } from '../shared/depot-permissions.service';
import {
  GetDiagnosticInstructionError,
  GetDiagnosticInstructionErrorEnum,
} from './get-diagnostic-instruction.errors';
import { GetDiagnosticInstructionInput } from './get-diagnostic-instruction.input';

@Injectable()
export class GetDiagnosticInstructionService {
  constructor(
    private readonly depotPermissionsService: DepotPermissionsService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async getDiagnosticInstruction(
    ref: GetDiagnosticInstructionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, GetDiagnosticInstructionError>> {
    const consultableResult =
      await this.depotPermissionsService.canConsulterDossier(ref, {
        user,
        tx,
      });
    if (!consultableResult.success) {
      return failure(
        consultableResult.error === 'DEMANDE_AVIS_NOT_FOUND'
          ? consultableResult.error
          : consultableResult.error === 'NOT_FOUND'
          ? GetDiagnosticInstructionErrorEnum.DEMARCHE_PCAET_NOT_FOUND
          : GetDiagnosticInstructionErrorEnum.UNAUTHORIZED
      );
    }
    const { demarcheId, collectiviteId } = consultableResult.data;

    return success(
      await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        tx
      )
    );
  }
}
