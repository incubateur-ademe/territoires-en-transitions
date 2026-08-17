import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import { DemarchePcaetVulnerabiliteRepository } from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  RemoveVulnerabiliteDomaineError,
  RemoveVulnerabiliteDomaineErrorEnum,
} from './remove-vulnerabilite-domaine.errors';
import { RemoveVulnerabiliteDomaineInput } from './remove-vulnerabilite-domaine.input';

@Injectable()
export class RemoveVulnerabiliteDomaineService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  /**
   * Retire le domaine de cette démarche. Le catalogue de la collectivité n'est
   * purgé que si plus aucune autre démarche ne le rattache : supprimer depuis
   * un dépôt ne doit jamais amputer la saisie d'un autre.
   */
  async removeDomaine(
    { collectiviteId, demarcheId, domaineId }: RemoveVulnerabiliteDomaineInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, RemoveVulnerabiliteDomaineError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(RemoveVulnerabiliteDomaineErrorEnum[access.error]);
      }

      const domaine = await this.vulnerabiliteRepository.findDomaine(
        { domaineId, collectiviteId },
        transaction
      );
      if (!domaine) {
        return failure(
          RemoveVulnerabiliteDomaineErrorEnum.DOMAINE_NON_ACCESSIBLE
        );
      }
      if (domaine.isSocle) {
        return failure(
          RemoveVulnerabiliteDomaineErrorEnum.DOMAINE_SOCLE_NON_MODIFIABLE
        );
      }

      await this.vulnerabiliteRepository.detachDomaine(
        { demarcheId, domaineId },
        transaction
      );

      const autresDemarches =
        await this.vulnerabiliteRepository.countAutresDemarchesRattachees(
          { demarcheId, domaineId },
          transaction
        );
      if (autresDemarches === 0) {
        await this.vulnerabiliteRepository.deleteDomaine(
          { domaineId, collectiviteId },
          transaction
        );
      }

      const payload = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        transaction
      );
      return success({ ...payload, snapshotDate: null });
    }, tx);
  }
}
