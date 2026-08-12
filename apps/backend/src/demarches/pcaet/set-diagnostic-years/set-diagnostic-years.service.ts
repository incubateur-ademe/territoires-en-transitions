import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTopicKindEnum,
  isDemarchePcaetDiagnosticMutable,
  isDiagnosticYearInBounds,
  normalizeExtraYears,
  REFERENCE_YEAR_MIN,
  type DemarchePcaetDiagnostic,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetDiagnosticRepository } from '../shared/demarche-pcaet-diagnostic.repository';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  SetDiagnosticYearsError,
  SetDiagnosticYearsErrorEnum,
} from './set-diagnostic-years.errors';
import { SetDiagnosticYearsInput } from './set-diagnostic-years.input';

@Injectable()
export class SetDiagnosticYearsService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly diagnosticRepository: DemarchePcaetDiagnosticRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async setYears(
    input: SetDiagnosticYearsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, SetDiagnosticYearsError>> {
    const { collectiviteId, demarcheId, topicCode, referenceYear } = input;

    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(SetDiagnosticYearsErrorEnum.UNAUTHORIZED);
    }

    const ref = await this.refRepository.findRef(
      { demarcheId, collectiviteId },
      undefined,
      tx
    );
    if (!ref) {
      return failure(SetDiagnosticYearsErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
    }
    if (!isDemarchePcaetDiagnosticMutable(ref.status)) {
      return failure(SetDiagnosticYearsErrorEnum.DIAGNOSTIC_NON_MODIFIABLE);
    }

    const topic = await this.diagnosticRepository.findTopicByCode(
      topicCode,
      tx
    );
    if (!topic || topic.kind !== DemarchePcaetTopicKindEnum.INDICATEURS) {
      return failure(SetDiagnosticYearsErrorEnum.TOPIC_NOT_FOUND);
    }

    // Un résultat se constate sur une année écoulée : l'année de
    // comptabilisation ne peut pas être future.
    if (
      referenceYear < REFERENCE_YEAR_MIN ||
      referenceYear > new Date().getFullYear()
    ) {
      return failure(SetDiagnosticYearsErrorEnum.ANNEE_HORS_BORNES);
    }

    const extraYears = normalizeExtraYears({
      extraYears: input.extraYears,
      referenceYear,
      horizons: topic.horizons,
    });
    if (
      extraYears.some(
        (year) => !isDiagnosticYearInBounds({ year, horizons: topic.horizons })
      )
    ) {
      return failure(SetDiagnosticYearsErrorEnum.ANNEE_HORS_BORNES);
    }

    await this.diagnosticRepository.upsertTopicYears(
      {
        demarcheId,
        topicId: topic.id,
        referenceYear,
        extraYears,
        userId: user.id,
      },
      tx
    );

    const payload = await this.diagnosticService.loadPayload(
      { demarcheId, collectiviteId },
      tx
    );
    return success({ ...payload, snapshotDate: null });
  }
}
