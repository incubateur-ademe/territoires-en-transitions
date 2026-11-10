import { Injectable } from '@nestjs/common';
import type { TrackedEventPropertyValue } from '@tet/backend/utils/tracking/event-tracker.interface';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import type { DemarchePcaetEvent } from './demarche-pcaet-tracking.constants';
import {
  buildDemarchePcaetEventProperties,
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
  constructor(private readonly trackingService: TrackingService) {}

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
}
