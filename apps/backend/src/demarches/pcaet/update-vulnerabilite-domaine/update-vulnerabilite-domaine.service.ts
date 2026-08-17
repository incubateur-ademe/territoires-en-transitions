import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import { isDomaineDejaExistant } from '../shared/demarche-pcaet-vulnerabilite-conflict.utils';
import { DemarchePcaetVulnerabiliteRepository } from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  UpdateVulnerabiliteDomaineError,
  UpdateVulnerabiliteDomaineErrorEnum,
} from './update-vulnerabilite-domaine.errors';
import { UpdateVulnerabiliteDomaineInput } from './update-vulnerabilite-domaine.input';

@Injectable()
export class UpdateVulnerabiliteDomaineService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async updateDomaine(
    {
      collectiviteId,
      demarcheId,
      domaineId,
      label,
    }: UpdateVulnerabiliteDomaineInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, UpdateVulnerabiliteDomaineError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(UpdateVulnerabiliteDomaineErrorEnum[access.error]);
      }

      const domaine = await this.vulnerabiliteRepository.findDomaine(
        { domaineId, collectiviteId },
        transaction
      );
      if (!domaine) {
        return failure(
          UpdateVulnerabiliteDomaineErrorEnum.DOMAINE_NON_ACCESSIBLE
        );
      }
      if (domaine.isSocle) {
        return failure(
          UpdateVulnerabiliteDomaineErrorEnum.DOMAINE_SOCLE_NON_MODIFIABLE
        );
      }

      // Se renommer soi-même (ou changer la casse de son propre libellé) reste
      // permis ; heurter un autre domaine ne l'est pas.
      const homonyme = await this.vulnerabiliteRepository.findDomaineByLabel(
        { collectiviteId, label },
        transaction
      );
      if (homonyme && homonyme.id !== domaineId) {
        return failure(
          UpdateVulnerabiliteDomaineErrorEnum.DOMAINE_DEJA_EXISTANT
        );
      }

      try {
        await this.vulnerabiliteRepository.updateDomaineLabel(
          { domaineId, collectiviteId, label, userId: user.id },
          transaction
        );
      } catch (error) {
        if (isDomaineDejaExistant(error)) {
          return failure(
            UpdateVulnerabiliteDomaineErrorEnum.DOMAINE_DEJA_EXISTANT
          );
        }
        throw error;
      }

      const payload = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        transaction
      );
      return success({ ...payload, snapshotDate: null });
    }, tx);
  }
}
