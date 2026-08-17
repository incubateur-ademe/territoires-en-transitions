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
  AddVulnerabiliteDomaineError,
  AddVulnerabiliteDomaineErrorEnum,
} from './add-vulnerabilite-domaine.errors';
import { AddVulnerabiliteDomaineInput } from './add-vulnerabilite-domaine.input';

@Injectable()
export class AddVulnerabiliteDomaineService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async addDomaine(
    { collectiviteId, demarcheId, label }: AddVulnerabiliteDomaineInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, AddVulnerabiliteDomaineError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(AddVulnerabiliteDomaineErrorEnum[access.error]);
      }

      // Le libellé peut déjà exister au catalogue de la collectivité sans être
      // rattaché à cette démarche : on le rattache alors, plutôt que de forcer
      // l'utilisateur à en inventer un autre.
      const existant = await this.vulnerabiliteRepository.findDomaineByLabel(
        { collectiviteId, label },
        transaction
      );

      if (existant) {
        const dejaRattache =
          existant.isSocle ||
          (await this.vulnerabiliteRepository.isDomaineRattache(
            { demarcheId, domaineId: existant.id },
            transaction
          ));
        if (dejaRattache) {
          return failure(
            AddVulnerabiliteDomaineErrorEnum.DOMAINE_DEJA_EXISTANT
          );
        }
        await this.vulnerabiliteRepository.attachDomaine(
          { demarcheId, domaineId: existant.id, userId: user.id },
          transaction
        );
      } else {
        try {
          const cree = await this.vulnerabiliteRepository.insertDomaine(
            { collectiviteId, label, userId: user.id },
            transaction
          );
          await this.vulnerabiliteRepository.attachDomaine(
            { demarcheId, domaineId: cree.id, userId: user.id },
            transaction
          );
        } catch (error) {
          if (isDomaineDejaExistant(error)) {
            return failure(
              AddVulnerabiliteDomaineErrorEnum.DOMAINE_DEJA_EXISTANT
            );
          }
          throw error;
        }
      }

      const payload = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        transaction
      );
      return success({ ...payload, snapshotDate: null });
    }, tx);
  }
}
