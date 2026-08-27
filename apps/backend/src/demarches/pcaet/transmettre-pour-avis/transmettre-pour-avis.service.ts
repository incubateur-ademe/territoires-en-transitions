import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  computeAvisDeadline,
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';
import { TransmettrePourAvisDemarchePcaetError } from './transmettre-pour-avis.errors';

@Injectable()
export class TransmettrePourAvisDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly instructeursRepository: PcaetInstructeursRepository
  ) {}

  /**
   * Transmet le dossier aux instances consultatives (préfet de région, conseil
   * régional, MRAe).
   *
   * Deux effets propres à cette transition : les instructeurs qui couvrent la
   * collectivité sont saisis, l'échéance de remise des avis est figée.
   */
  async transmettre(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, TransmettrePourAvisDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS,
      { user, tx },
      async ({ demarche, transaction }) => {
        // Transmettre, c'est saisir : sans cette ligne le dossier n'atteindrait
        // aucun tableau d'instructeur. Dans la transaction de la transition,
        // donc un dossier ne peut pas passer `transmis_pour_avis` en laissant
        // ses destinataires derrière lui.
        await this.instructeursRepository.saisirInstructeurs(
          {
            demarcheId: demarche.id,
            collectiviteId: demarche.collectiviteId,
          },
          transaction
        );

        // L'échéance est figée maintenant : si le délai légal change, les
        // dossiers déjà transmis gardent celle qui s'appliquait à eux.
        const now = new Date();
        return {
          transmittedAt: now.toISOString(),
          avisDeadlineAt: computeAvisDeadline(now).toISOString(),
        };
      }
    );
  }
}
