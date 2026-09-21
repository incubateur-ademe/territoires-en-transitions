import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  peutRecevoirSousThematique,
  type PcaetDiagnostic,
} from '@tet/domain/demarches';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { isThematiqueDejaExistant } from '../shared/demarche-pcaet-vulnerabilite-conflict.utils';
import { DemarchePcaetVulnerabiliteRepository } from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  AddVulnerabiliteThematiqueError,
  AddVulnerabiliteThematiqueErrorEnum,
} from './add-vulnerabilite-thematique.errors';
import { AddVulnerabiliteThematiqueInput } from './add-vulnerabilite-thematique.input';

@Injectable()
export class AddVulnerabiliteThematiqueService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async addThematique(
    {
      collectiviteId,
      demarcheId,
      label,
      parentId,
    }: AddVulnerabiliteThematiqueInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<PcaetDiagnostic, AddVulnerabiliteThematiqueError>> {
    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(AddVulnerabiliteThematiqueErrorEnum[access.error]);
      }

      if (parentId !== null) {
        const parente = await this.vulnerabiliteRepository.findThematique(
          { thematiqueId: parentId, collectiviteId },
          transaction
        );
        if (!parente) {
          return failure(
            AddVulnerabiliteThematiqueErrorEnum.THEMATIQUE_PARENT_NON_ACCESSIBLE
          );
        }
        if (!peutRecevoirSousThematique(parente)) {
          // Le socle n'est pas modifiable — on n'y greffe pas davantage qu'on
          // ne le renomme — et une sous-thématique n'en porte pas à son tour.
          return failure(
            parente.isSocle
              ? AddVulnerabiliteThematiqueErrorEnum.THEMATIQUE_PARENT_SOCLE
              : AddVulnerabiliteThematiqueErrorEnum.THEMATIQUE_PARENT_NON_RACINE
          );
        }
      }

      // Le libellé peut déjà exister au catalogue de la collectivité sans être
      // rattaché à cette démarche : on le rattache alors, plutôt que de forcer
      // l'utilisateur à en inventer un autre. L'homonymie ne se juge que dans
      // la fratrie visée.
      const existant = await this.vulnerabiliteRepository.findThematiqueByLabel(
        { collectiviteId, label, parentId },
        transaction
      );

      if (existant) {
        const dejaRattache =
          existant.isSocle ||
          (await this.vulnerabiliteRepository.isThematiqueRattache(
            { demarcheId, thematiqueId: existant.id },
            transaction
          ));
        if (dejaRattache) {
          return failure(
            AddVulnerabiliteThematiqueErrorEnum.THEMATIQUE_DEJA_EXISTANT
          );
        }
        await this.vulnerabiliteRepository.attachThematique(
          { demarcheId, thematiqueId: existant.id, userId: user.id },
          transaction
        );
      } else {
        try {
          const cree = await this.vulnerabiliteRepository.insertThematique(
            {
              collectiviteId,
              label,
              parentId,
              userId: user.id,
            },
            transaction
          );
          await this.vulnerabiliteRepository.attachThematique(
            { demarcheId, thematiqueId: cree.id, userId: user.id },
            transaction
          );
        } catch (error) {
          if (isThematiqueDejaExistant(error)) {
            return failure(
              AddVulnerabiliteThematiqueErrorEnum.THEMATIQUE_DEJA_EXISTANT
            );
          }
          throw error;
        }
      }

      const payload = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        transaction
      );
      return success(payload);
    }, tx);
  }
}
