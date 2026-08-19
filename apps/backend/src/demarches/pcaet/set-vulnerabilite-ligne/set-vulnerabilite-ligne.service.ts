import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import type { DemarchePcaetDiagnostic } from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetAccessService } from '../shared/demarche-pcaet-access.service';
import {
  DemarchePcaetVulnerabiliteRepository,
  type VulnerabiliteLignePatch,
} from '../shared/demarche-pcaet-vulnerabilite.repository';
import {
  SetVulnerabiliteLigneError,
  SetVulnerabiliteLigneErrorEnum,
} from './set-vulnerabilite-ligne.errors';
import { SetVulnerabiliteLigneInput } from './set-vulnerabilite-ligne.input';

/** Un objectif vidé par l'utilisateur redevient une absence de saisie. */
const toObjectif = (texte: string | null | undefined) => {
  if (texte === undefined) {
    return undefined;
  }
  const trimmed = texte?.trim() ?? '';
  return trimmed.length === 0 ? null : trimmed;
};

@Injectable()
export class SetVulnerabiliteLigneService {
  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly accessService: DemarchePcaetAccessService,
    private readonly vulnerabiliteRepository: DemarchePcaetVulnerabiliteRepository,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  async setLigne(
    input: SetVulnerabiliteLigneInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaetDiagnostic, SetVulnerabiliteLigneError>> {
    const { collectiviteId, demarcheId, thematiqueId } = input;

    return this.transactionManager.executeSingle(async (transaction) => {
      const access = await this.accessService.assertWritable(
        { collectiviteId, demarcheId },
        'amont',
        { user, tx: transaction }
      );
      if (!access.success) {
        return failure(SetVulnerabiliteLigneErrorEnum[access.error]);
      }

      // Le socle et les thématiques de la collectivité, rien d'autre : une thématique
      // ajouté par une autre collectivité n'est pas adressable.
      const thematique = await this.vulnerabiliteRepository.findThematique(
        { thematiqueId, collectiviteId },
        transaction
      );
      if (!thematique) {
        return failure(SetVulnerabiliteLigneErrorEnum.THEMATIQUE_NON_ACCESSIBLE);
      }

      // Une thématique ajoutée doit être rattachée à cette démarche pour y être
      // saisi ; le socle s'y impose sans rattachement préalable.
      if (
        !thematique.isSocle &&
        !(await this.vulnerabiliteRepository.isThematiqueRattache(
          { demarcheId, thematiqueId },
          transaction
        ))
      ) {
        return failure(SetVulnerabiliteLigneErrorEnum.THEMATIQUE_NON_ACCESSIBLE);
      }

      const patch: VulnerabiliteLignePatch = {
        ...(input.niveau ? { niveau: input.niveau } : {}),
        ...(input.objectifs2050 !== undefined
          ? { objectifs2050: toObjectif(input.objectifs2050) }
          : {}),
        ...(input.objectifs2100 !== undefined
          ? { objectifs2100: toObjectif(input.objectifs2100) }
          : {}),
      };

      await this.vulnerabiliteRepository.patchLigne(
        { demarcheId, thematiqueId, patch, userId: user.id },
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
