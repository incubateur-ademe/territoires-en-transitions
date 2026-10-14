import { Injectable } from '@nestjs/common';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetSuivantRepository } from '../shared/demarche-pcaet-suivant.repository';
import {
  DemarchePcaetTransitionService,
  type DemarchePcaetTransitionResult,
} from '../shared/demarche-pcaet-transition.service';

type ArchiverDemarchePcaetError = Extract<
  DemarchePcaetTransitionResult,
  { success: false }
>['error'];

@Injectable()
export class ArchiverDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly suivantRepository: DemarchePcaetSuivantRepository
  ) {}

  /**
   * Archive les PCAET de la collectivité que le suivant remplace. Appelé à la
   * publication, dans sa transaction : le nouveau PCAET n'entre pas en vigueur
   * à côté de l'ancien.
   *
   * Personne ne décide de l'archivage, c'est l'adoption du suivant qui le
   * constate — d'où une transition sans acteur, et aucune route pour le
   * déclencher à la main. Rend les démarches archivées.
   */
  async archiverRemplacees(
    { collectiviteId }: { collectiviteId: number },
    { tx }: { tx?: Transaction }
  ): Promise<Result<DemarchePcaet[], ArchiverDemarchePcaetError>> {
    const demarcheIds = await this.suivantRepository.listRemplaceesIds(
      { collectiviteId },
      tx
    );

    const archivees: DemarchePcaet[] = [];
    for (const demarcheId of demarcheIds) {
      const result = await this.transitionService.applyAsSystem(
        { collectiviteId, demarcheId },
        DemarchePcaetTransitionEnum.PCAET_SUIVANT_ADOPTE,
        { tx }
      );
      if (!result.success) {
        return failure(result.error);
      }
      archivees.push(result.data);
    }
    return success(archivees);
  }
}
