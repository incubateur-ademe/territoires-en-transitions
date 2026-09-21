import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
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
   * Retire la thématique de cette démarche, ses sous-thématiques avec elle : une
   * sous-thématique sans parente n'a plus de place dans le tableau. Le catalogue
   * de la collectivité n'est purgé que si plus aucune autre démarche ne la
   * rattache — supprimer depuis un dépôt ne doit jamais amputer la saisie d'un
   * autre.
   */
  async removeThematique(
    {
      collectiviteId,
      demarcheId,
      thematiqueId,
    }: RemoveVulnerabiliteThematiqueInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, RemoveVulnerabiliteThematiqueError>> {
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

      await this.vulnerabiliteRepository.detachThematiqueEtEnfants(
        { demarcheId, thematiqueId },
        transaction
      );

      // Le rattachement se compte sur la parente : ses sous-thématiques la
      // suivent, et le CASCADE de `parent_id` les emporte du catalogue.
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
      return success(payload);
    }, tx);
  }
}
