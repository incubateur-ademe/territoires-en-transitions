import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  computeAvisDeadline,
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { DemarchePcaetDiagnosticRepository } from '../shared/demarche-pcaet-diagnostic.repository';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';
import { TransmettrePourAvisDemarchePcaetError } from './transmettre-pour-avis.errors';

@Injectable()
export class TransmettrePourAvisDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly diagnosticRepository: DemarchePcaetDiagnosticRepository,
    private readonly instructeursRepository: PcaetInstructeursRepository
  ) {}

  /**
   * Transmet le dossier aux instances consultatives (préfet de région, conseil
   * régional, MRAe).
   *
   * Trois effets propres à cette transition : les instructeurs qui couvrent la
   * collectivité sont saisis, l'échéance de remise des avis est figée, et le
   * diagnostic est photographié.
   */
  async transmettre(
    input: DemarchePcaetTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, TransmettrePourAvisDemarchePcaetError>> {
    return this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS,
      { user, tx },
      async ({ demarche, guardContext, transaction }) => {
        // Le diagnostic transmis est figé : les instances consultatives lisent
        // cette photo, que la collectivité continue ou non de faire évoluer ses
        // indicateurs.
        await this.diagnosticRepository.insertSnapshot(
          {
            demarcheId: demarche.id,
            jalon: 'transmission',
            // Toujours chargé ici : `dossierComplet` garde la transmission,
            // donc le diagnostic fait partie du contexte des guards.
            payload:
              guardContext.diagnosticPayload ??
              (await this.diagnosticService.loadPayload(
                {
                  demarcheId: demarche.id,
                  collectiviteId: demarche.collectiviteId,
                },
                transaction
              )),
            userId: user.id,
          },
          transaction
        );

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
