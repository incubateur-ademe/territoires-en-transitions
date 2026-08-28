import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { PcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { isThematiqueDejaExistant } from '../shared/demarche-pcaet-vulnerabilite-conflict.utils';
import { DemarchePcaetVulnerabiliteRepository } from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  UpdateVulnerabiliteThematiqueError,
  UpdateVulnerabiliteThematiqueErrorEnum,
} from './update-vulnerabilite-thematique.errors';
import { UpdateVulnerabiliteThematiqueInput } from './update-vulnerabilite-thematique.input';

@Injectable()
export class UpdateVulnerabiliteThematiqueService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async updateThematique(
    {
      collectiviteId,
      demarcheId,
      thematiqueId,
      label,
    }: UpdateVulnerabiliteThematiqueInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, UpdateVulnerabiliteThematiqueError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(UpdateVulnerabiliteThematiqueErrorEnum[access.error]);
      }

      const thematique = await this.vulnerabiliteRepository.findThematique(
        { thematiqueId, collectiviteId },
        transaction
      );
      if (!thematique) {
        return failure(
          UpdateVulnerabiliteThematiqueErrorEnum.THEMATIQUE_NON_ACCESSIBLE
        );
      }
      if (thematique.isSocle) {
        return failure(
          UpdateVulnerabiliteThematiqueErrorEnum.THEMATIQUE_SOCLE_NON_MODIFIABLE
        );
      }

      // Se renommer soi-même (ou changer la casse de son propre libellé) reste
      // permis ; heurter une autre thématique ne l'est pas.
      const homonyme = await this.vulnerabiliteRepository.findThematiqueByLabel(
        { collectiviteId, label },
        transaction
      );
      if (homonyme && homonyme.id !== thematiqueId) {
        return failure(
          UpdateVulnerabiliteThematiqueErrorEnum.THEMATIQUE_DEJA_EXISTANT
        );
      }

      try {
        await this.vulnerabiliteRepository.updateThematiqueLabel(
          { thematiqueId, collectiviteId, label, userId: user.id },
          transaction
        );
      } catch (error) {
        if (isThematiqueDejaExistant(error)) {
          return failure(
            UpdateVulnerabiliteThematiqueErrorEnum.THEMATIQUE_DEJA_EXISTANT
          );
        }
        throw error;
      }

      const payload = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        transaction
      );
      return success(payload);
    }, tx);
  }
}
