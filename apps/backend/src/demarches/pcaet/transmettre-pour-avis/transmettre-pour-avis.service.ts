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
import { TransmettrePourAvisDemarchePcaetError } from './transmettre-pour-avis.errors';

@Injectable()
export class TransmettrePourAvisDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService,
    private readonly diagnosticRepository: DemarchePcaetDiagnosticRepository
  ) {}

  /**
   * Transmet le dossier aux instances consultatives (préfet de région, conseil
   * régional, MRAe).
   *
   * Deux effets propres à cette transition : l'échéance de remise des avis est
   * figée, et le diagnostic est photographié.
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
