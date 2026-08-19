import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import { DemarchePcaetVulnerabiliteRepository } from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  RemoveVulnerabiliteThematiqueError,
  RemoveVulnerabiliteThematiqueErrorEnum,
} from './remove-vulnerabilite-thematique.errors';
import { RemoveVulnerabiliteThematiqueInput } from './remove-vulnerabilite-thematique.input';

@Injectable()
export class RemoveVulnerabiliteThematiqueService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  /**
   * Retire la thématique de cette démarche. Le catalogue de la collectivité n'est
   * purgé que si plus aucune autre démarche ne le rattache : supprimer depuis
   * un dépôt ne doit jamais amputer la saisie d'un autre.
   */
  async removeThematique(
    { collectiviteId, demarcheId, thematiqueId }: RemoveVulnerabiliteThematiqueInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, RemoveVulnerabiliteThematiqueError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(RemoveVulnerabiliteThematiqueErrorEnum[access.error]);
      }

      const thematique = await this.vulnerabiliteRepository.findThematique(
        { thematiqueId, collectiviteId },
        transaction
      );
      if (!thematique) {
        return failure(
          RemoveVulnerabiliteThematiqueErrorEnum.THEMATIQUE_NON_ACCESSIBLE
        );
      }
      if (thematique.isSocle) {
        return failure(
          RemoveVulnerabiliteThematiqueErrorEnum.THEMATIQUE_SOCLE_NON_MODIFIABLE
        );
      }

      await this.vulnerabiliteRepository.detachThematique(
        { demarcheId, thematiqueId },
        transaction
      );

      const autresDemarches =
        await this.vulnerabiliteRepository.countAutresDemarchesRattachees(
          { demarcheId, thematiqueId },
          transaction
        );
      if (autresDemarches === 0) {
        await this.vulnerabiliteRepository.deleteThematique(
          { thematiqueId, collectiviteId },
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
