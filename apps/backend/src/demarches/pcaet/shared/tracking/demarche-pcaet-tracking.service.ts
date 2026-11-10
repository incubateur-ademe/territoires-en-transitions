import { Injectable, Logger } from '@nestjs/common';
import type { TrackedEventPropertyValue } from '@tet/backend/utils/tracking/event-tracker.interface';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { DemarchePcaetRefRepository } from '../demarche-pcaet-ref.repository';
import type {
  ContexteDemandeAvis,
  DossierConsultable,
} from '../depot-permissions.service';
import {
  DemarchePcaetActeurEnum,
  type DemarchePcaetEvent,
} from './demarche-pcaet-tracking.constants';
import {
  buildDemarchePcaetEventProperties,
  daysBetween,
  getDemarchePcaetDistinctId,
  type DemarchePcaetTrackingContext,
  type DemarchePcaetTrackingSubject,
} from './demarche-pcaet-tracking.rules';

/**
 * Capture des événements du dépôt PCAET : propriétés communes, groupe
 * `collectivite`, identifiant de l'acteur.
 *
 * À appeler **après** le succès de l'opération, hors transaction : un
 * événement ne se rejoue pas à l'envers. Ne lève jamais — `TrackingService`
 * absorbe les erreurs du client PostHog.
 */
@Injectable()
export class DemarchePcaetTrackingService {
  private readonly logger = new Logger(DemarchePcaetTrackingService.name);

  constructor(
    private readonly trackingService: TrackingService,
    private readonly refRepository: DemarchePcaetRefRepository
  ) {}

  track(
    event: DemarchePcaetEvent,
    subject: DemarchePcaetTrackingSubject,
    {
      userId,
      properties,
      ...context
    }: DemarchePcaetTrackingContext & {
      userId: string | null | undefined;
      properties?: Record<string, TrackedEventPropertyValue>;
    }
  ): void {
    const { distinctId, isPerson } = getDemarchePcaetDistinctId(
      subject,
      userId
    );
    this.trackingService.capture({
      distinctId,
      event,
      properties: {
        ...buildDemarchePcaetEventProperties(subject, context, properties),
        ...(isPerson ? {} : { $process_person_profile: false }),
      },
      groups: { collectivite: String(subject.collectiviteId) },
    });
  }

  /**
   * Une action d'instructeur sur une saisine : le dossier est celui de la
   * déposante, l'acteur le service saisi. L'événement porte donc le groupe de
   * la déposante — c'est son dossier qu'on suit — et le type du service en
   * propriété.
   */
  trackInstructeur(
    event: DemarchePcaetEvent,
    contexte: ContexteDemandeAvis,
    {
      userId,
      properties,
    }: {
      userId: string;
      properties?: Record<string, TrackedEventPropertyValue>;
    }
  ): void {
    const joursRestants = contexte.avisDeadlineAt
      ? daysBetween(new Date().toISOString(), contexte.avisDeadlineAt)
      : null;
    this.track(
      event,
      {
        id: contexte.demarcheId,
        collectiviteId: contexte.collectiviteId,
        status: contexte.demarcheStatus,
      },
      {
        userId,
        acteur: DemarchePcaetActeurEnum.INSTRUCTEUR,
        instructeurType: contexte.instructeurType,
        perimetreSaisine: contexte.perimetre,
        properties: {
          instructeurCollectiviteId: contexte.instructeurCollectiviteId,
          joursAvantEcheanceAvis: joursRestants,
          ...properties,
        },
      }
    );
  }

  /**
   * Pour les opérations qui ne lisent pas la démarche elle-même (lecture et
   * téléchargement du dossier) : la référence est relue après coup, sans
   * retenir la réponse. Une démarche introuvable n'émet rien.
   */
  trackByRef(
    event: DemarchePcaetEvent,
    ref: { demarcheId: number; collectiviteId: number },
    context: Parameters<DemarchePcaetTrackingService['track']>[2]
  ): void {
    void this.refRepository
      .findRef(ref)
      .then((demarche) => {
        if (demarche) {
          this.track(event, demarche, context);
        }
      })
      .catch((error) =>
        this.logger.warn(`Événement ${event} non émis : ${error}`)
      );
  }

  /** Lecture d'un dossier par un service instructeur. */
  trackDossierInstruction(
    event: DemarchePcaetEvent,
    dossier: DossierConsultable,
    {
      userId,
      properties,
    }: {
      userId: string;
      properties?: Record<string, TrackedEventPropertyValue>;
    }
  ): void {
    this.trackByRef(event, dossier, {
      userId,
      acteur: DemarchePcaetActeurEnum.INSTRUCTEUR,
      instructeurType: dossier.instructeurType,
      perimetreSaisine: dossier.perimetre,
      properties: {
        instructeurCollectiviteId: dossier.instructeurCollectiviteId,
        parSaisine: dossier.demandeAvisId !== null,
        ...properties,
      },
    });
  }
}
