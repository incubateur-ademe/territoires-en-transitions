import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetLectureService } from '../shared/demarche-pcaet-lecture.service';
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
    private readonly lectureService: DemarchePcaetLectureService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async getDiagnostic(
    input: GetDiagnosticInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, GetDiagnosticError>> {
    // Qui édite la démarche et lit les valeurs de la collectivité, ou un membre
    // d'un EPCI que la démarche couvre : le diagnostic fait partie du dossier
    // qu'il consulte.
    const lectureResult = await this.lectureService.canRead(input, {
      user,
      tx,
    });
    if (!lectureResult.success) {
      return failure(GetDiagnosticErrorEnum.UNAUTHORIZED);
    }
    if (!lectureResult.data.lectureSeule) {
      const valeursResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['INDICATEURS.VALEURS.READ'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: input.collectiviteId },
        tx
      );
      if (!valeursResult.success) {
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
