import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  DemarchePcaetTopicKindEnum,
  isDiagnosticYearInBounds,
  normalizeExtraYears,
  REFERENCE_YEAR_MIN,
  type DemarchePcaetDiagnostic,
} from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticRepository } from '../shared/demarche-pcaet-diagnostic.repository';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import {
  SetDiagnosticYearsError,
  SetDiagnosticYearsErrorEnum,
} from './set-diagnostic-years.errors';
import { SetDiagnosticYearsInput } from './set-diagnostic-years.input';

@Injectable()
export class SetDiagnosticYearsService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly diagnosticRepository: DemarchePcaetDiagnosticRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async setYears(
    input: SetDiagnosticYearsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, SetDiagnosticYearsError>> {
    // Le verrou du préambule d'écriture n'a d'effet que dans une transaction :
    // la saisie et sa vérification doivent partager la même.
    return this.transactionManager.executeSingle(async (transaction) => {
      const { collectiviteId, demarcheId, topicCode, referenceYear } = input;

      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(SetDiagnosticYearsErrorEnum[access.error]);
      }

      const topic = await this.diagnosticRepository.findTopicByCode(
        topicCode,
        transaction
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
          (year) =>
            !isDiagnosticYearInBounds({ year, horizons: topic.horizons })
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
        transaction
      );

      const payload = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        transaction
      );
      return success({ ...payload, snapshotDate: null });
    }, tx);
  }
}
