import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { Result } from '@tet/backend/utils/result.type';
import {
  computeAvisDeadline,
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { NotifyDossierTransmisService } from '../notifications/notify-dossier-transmis/notify-dossier-transmis.service';
import type { ServiceSansCompte } from '../notifications/notify-dossier-transmis/notify-support-services-sans-compte.props';
import { DemarchePcaetTransitionInput } from '../shared/demarche-pcaet-transition.input';
import { DemarchePcaetTransitionService } from '../shared/demarche-pcaet-transition.service';
import { PcaetInstructeursRepository } from '../shared/pcaet-instructeurs.repository';
import { DemarchePcaetDemoService } from '../demo/demarche-pcaet-demo.service';
import { TransmettrePourAvisDemarchePcaetError } from './transmettre-pour-avis.errors';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';

@Injectable()
export class TransmettrePourAvisDemarchePcaetService {
  constructor(
    private readonly transitionService: DemarchePcaetTransitionService,
    private readonly instructeursRepository: PcaetInstructeursRepository,
    private readonly notifyDossierTransmisService: NotifyDossierTransmisService,
    private readonly trackingService: DemarchePcaetTrackingService,
    private readonly demoService: DemarchePcaetDemoService
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
    // Recueilli dans la transaction, exploité après : le mail au support ne se
    // rejoue pas à l'envers, il attend que la transmission soit acquise.
    let servicesSansCompte: ServiceSansCompte[] = [];
    let saisines: { type: string; perimetre: string }[] = [];

    const result = await this.transitionService.apply(
      input,
      DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS,
      { user, tx },
      async ({ demarche, transaction }) => {
        // En démo, ce sont les services fictifs qui sont saisis, et personne
        // n'est prévenu : une démonstration ne doit rien envoyer à une vraie
        // DREAL ni à un vrai conseil régional.
        if (
          await this.demoService.isDemo(
            user,
            demarche.collectiviteId,
            transaction
          )
        ) {
          const services = await this.demoService.listServicesDemo(transaction);
          saisines = await this.instructeursRepository.saisirServicesDemo(
            {
              demarcheId: demarche.id,
              instructeurCollectiviteIds: services.map(({ id }) => id),
            },
            transaction
          );
        } else {
          // Transmettre, c'est saisir : sans cette ligne le dossier
          // n'atteindrait aucun tableau d'instructeur. Dans la transaction de
          // la transition, donc un dossier ne peut pas passer
          // `transmis_pour_avis` en laissant ses destinataires derrière lui.
          const demandes = await this.instructeursRepository.saisirInstructeurs(
            {
              demarcheId: demarche.id,
              collectiviteId: demarche.collectiviteId,
            },
            transaction
          );
          saisines = demandes;

          servicesSansCompte =
            await this.notifyDossierTransmisService.creerNotifications(
              { demandes, createdBy: user.id },
              transaction
            );
        }

        // L'échéance est figée maintenant : si le délai légal change, les
        // dossiers déjà transmis gardent celle qui s'appliquait à eux.
        const now = new Date();
        return {
          transmittedAt: now.toISOString(),
          avisDeadlineAt: computeAvisDeadline(now).toISOString(),
        };
      }
    );

    if (result.success) {
      await this.notifyDossierTransmisService.alerterSupport({
        demarche: result.data,
        services: servicesSansCompte,
      });
      this.trackingService.track(
        DemarchePcaetEventEnum.TRANSMISE,
        result.data,
        {
          userId: user.id,
          acteur: DemarchePcaetActeurEnum.COLLECTIVITE,
          properties: {
            nbSaisines: saisines.length,
            nbSaisinesSecondaires: saisines.filter(
              ({ perimetre }) => perimetre === 'secondaire'
            ).length,
            typesSaisis: [...new Set(saisines.map(({ type }) => type))].sort(),
            nbServicesSansCompte: servicesSansCompte.length,
          },
        }
      );
    }

    return result;
  }
}
