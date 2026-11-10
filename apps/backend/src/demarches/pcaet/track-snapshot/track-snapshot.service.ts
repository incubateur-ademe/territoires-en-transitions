import { Injectable, Logger } from '@nestjs/common';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { isDemarchePcaetDiagnosticComplet } from '@tet/domain/demarches';
import { getErrorMessage } from '@tet/domain/utils';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import { PcaetAvisRepository } from '../shared/pcaet-avis.repository';
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from '../shared/tracking/demarche-pcaet-tracking.constants';
import { daysBetween } from '../shared/tracking/demarche-pcaet-tracking.rules';
import { DemarchePcaetTrackingService } from '../shared/tracking/demarche-pcaet-tracking.service';
import {
  statusKey,
  TrackSnapshotRepository,
  type DemarchePcaetSuivie,
} from './track-snapshot.repository';
import { countAvis, listBlocagesDossier } from './track-snapshot.rules';

/** Une démarche archivée reste suivie ce temps-là, pour voir son archivage. */
const ARCHIVEES_SUIVIES_JOURS = 30;

export type TrackSnapshotResult = { suivies: number; echecs: number };

/**
 * Photographie quotidienne du stock des démarches PCAET dans PostHog : une
 * ligne par démarche, avec son statut, son âge et ce qui la retient.
 *
 * PostHog ne compte que des événements : sans cette photo, « combien de
 * dossiers en instruction ce jour-là » se reconstruirait mal depuis les seules
 * transitions. Lancée chaque nuit par le planificateur.
 */
@Injectable()
export class TrackSnapshotService {
  private readonly logger = new Logger(TrackSnapshotService.name);

  constructor(
    private readonly repository: TrackSnapshotRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly planActionsRepository: DemarchePlanActionsRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly avisRepository: PcaetAvisRepository,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  /** Ne lève pas : une démarche en échec est comptée, les autres partent. */
  async trackSnapshot(): Promise<TrackSnapshotResult> {
    const now = new Date();
    const demarches = await this.repository.listDemarchesSuivies(
      new Date(now.getTime() - ARCHIVEES_SUIVIES_JOURS * 86_400_000)
    );
    const enteredAt = await this.repository.listStatusEnteredAt(
      demarches.map(({ id }) => id)
    );

    let echecs = 0;
    for (const demarche of demarches) {
      try {
        await this.trackDemarche(demarche, enteredAt, now);
      } catch (error) {
        // Une démarche illisible ne prive pas les autres de leur photo.
        echecs += 1;
        this.logger.warn(
          `Photo de la démarche PCAET ${
            demarche.id
          } non émise : ${getErrorMessage(error)}`
        );
      }
    }

    this.logger.log(
      `Photo du stock PCAET : ${
        demarches.length - echecs
      } démarche(s), ${echecs} en échec`
    );
    return { suivies: demarches.length - echecs, echecs };
  }

  private async trackDemarche(
    demarche: DemarchePcaetSuivie,
    enteredAt: Map<string, string>,
    now: Date
  ) {
    const [context, planActionIds, unverifiedPlanActionIds, pilotes] =
      await Promise.all([
        this.guardsService.loadContext(demarche, null),
        this.planActionsRepository.listPlanActionIds(demarche.id),
        this.planActionsRepository.listUnverifiedPlanActionIds(demarche.id),
        this.pilotesRepository.listPiloteUserIds(demarche.id),
      ]);
    const demandesAvis =
      context.demandesAvis ??
      (demarche.transmittedAt !== null
        ? await this.avisRepository.listAchevementDemandes(demarche.id)
        : []);
    const blocages = listBlocagesDossier(
      demarche.status,
      this.guardsService.computeGuardResults(context, null)
    );
    const joursAvantEcheance = demarche.avisDeadlineAt
      ? daysBetween(now.toISOString(), demarche.avisDeadlineAt)
      : null;

    this.trackingService.track(DemarchePcaetEventEnum.SNAPSHOT, demarche, {
      userId: null,
      acteur: DemarchePcaetActeurEnum.SYSTEME,
      properties: {
        joursDepuisCreation: daysBetween(demarche.createdAt, now),
        joursDansStatut: daysBetween(
          enteredAt.get(statusKey(demarche.id, demarche.status)) ??
            demarche.createdAt,
          now
        ),
        joursDepuisTransmission: daysBetween(demarche.transmittedAt, now),
        joursDepuisPublication: daysBetween(demarche.publishedAt, now),
        joursAvantEcheanceAvis: joursAvantEcheance,
        echeanceAvisDepassee:
          joursAvantEcheance === null ? null : joursAvantEcheance < 0,
        ...countAvis(demandesAvis),
        nbPlans: planActionIds.length,
        nbPlansAVerifier: unverifiedPlanActionIds.length,
        nbPlansSecteursARenseigner:
          context.secteursARenseignerPlanActionIds?.length ?? null,
        nbPilotesAvecCompte: pilotes.filter(({ userId }) => !!userId).length,
        documentsAmontComplets: context.documentsComplets ?? null,
        documentsAvalComplets: context.documentsAvalComplets ?? null,
        diagnosticComplet: context.diagnostic
          ? isDemarchePcaetDiagnosticComplet(context.diagnostic)
          : null,
        transitionsAtteignables: blocages.transitionsAtteignables,
        bloquePar: blocages.bloquePar,
      },
    });
  }
}
