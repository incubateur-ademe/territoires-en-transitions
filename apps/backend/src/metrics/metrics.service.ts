import { ListDefinitionsService } from '@/backend/indicateurs/definitions/list-definitions/list-definitions.service';
import { CollectiviteMetricsResponse } from '@/backend/metrics/collectivite-metrics.response';
import { PersonalMetricsResponse } from '@/backend/metrics/personal-metrics.response';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@/backend/plans/fiches/plan-actions.service';
import { ListLabellisationsService } from '@/backend/referentiels/labellisations/list-labellisations.service';
import { ListActionsService } from '@/backend/referentiels/list-actions/list-actions.service';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { Injectable, Logger } from '@nestjs/common';
import { LabellisationRecord } from '../referentiels/labellisations/list-labellisations.api-response';

@Injectable()
export default class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly permissionsService: PermissionService,
    private readonly listLabellisationService: ListLabellisationsService,
    private readonly planActionsService: PlanActionsService,
    private readonly listFichesService: ListFichesService,
    private readonly listDefinitionsService: ListDefinitionsService,
    private readonly listActionsService: ListActionsService
  ) {}

  /**
   * Fetch les metriques du tableau de bord pour une collectivité.
   */
  async getCollectiviteMetrics(
    collectiviteId: number,
    user: AuthUser
  ): Promise<CollectiviteMetricsResponse> {
    await this.permissionsService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des métriques globales pour la collectivité ${collectiviteId}`
    );

    const response: CollectiviteMetricsResponse = {
      labellisations: {},
      plans: {
        count: 0,
        fiches: 0,
      },
      indicateurs: {
        favoris: 0,
        personnalises: 0,
      },
    };
    const promises: Promise<void>[] = [];

    promises.push(
      this.listLabellisationService
        .listCollectiviteLabellisations({
          collectiviteId,
          page: 1,
        })
        .then((labellisationsMetric) => {
          if (labellisationsMetric.data?.length) {
            const collectiviteLabellisation = labellisationsMetric.data[0];
            const labellisationKeys = Object.keys(
              collectiviteLabellisation.labellisations || {}
            );
            labellisationKeys.forEach((key) => {
              const referentiel = key as ReferentielId;
              response.labellisations[referentiel] =
                collectiviteLabellisation.labellisations?.[referentiel]
                  ?.courante ?? ({} as LabellisationRecord);
            });
          }
          return;
        })
    );

    promises.push(
      this.planActionsService.count(collectiviteId).then((count) => {
        response.plans.count = count;
        return;
      })
    );

    promises.push(
      this.listFichesService.count(collectiviteId).then((count) => {
        response.plans.fiches = count;
        return;
      })
    );

    promises.push(
      this.listDefinitionsService
        .getFavorisCount({ collectiviteId }, user)
        .then((favorisCount) => {
          response.indicateurs.favoris = favorisCount;
          return;
        })
    );

    promises.push(
      this.listDefinitionsService
        .getPersonnalisesCount({ collectiviteId }, user)
        .then((personnalisesCount) => {
          response.indicateurs.personnalises = personnalisesCount;
          return;
        })
    );

    await Promise.all(promises);

    return response;
  }

  async getPersonalMetrics(
    collectiviteId: number,
    user: AuthUser
  ): Promise<PersonalMetricsResponse> {
    await this.permissionsService.isAllowed(
      user,
      PermissionOperationEnum['COLLECTIVITES.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des métriques personnelles pour la collectivité ${collectiviteId} et l'utilisateur ${user.id}`
    );

    const response: PersonalMetricsResponse = {
      plans: {
        count: 0,
        piloteFichesCount: 0,
        piloteFichesIndicateursCount: 0,
      },
      indicateurs: {
        piloteCount: 0,
      },
      referentiels: {
        piloteMesuresCount: 0,
      },
    };

    const promises: Promise<void>[] = [];

    promises.push(
      this.planActionsService.count(collectiviteId).then((count) => {
        response.plans.count = count;
        return;
      })
    );

    promises.push(
      this.listFichesService
        .countPiloteFiches(collectiviteId, user)
        .then((count) => {
          response.plans.piloteFichesCount = count;
          return;
        })
    );

    promises.push(
      this.listFichesService
        .countPiloteFichesIndicateurs(collectiviteId, user)
        .then((count) => {
          response.plans.piloteFichesIndicateursCount = count;
          return;
        })
    );

    promises.push(
      this.listDefinitionsService
        .getMesIndicateursCount({ collectiviteId }, user)
        .then((piloteCount) => {
          response.indicateurs.piloteCount = piloteCount;
          return;
        })
    );

    promises.push(
      this.listActionsService
        .countPiloteActions(collectiviteId, user)
        .then((piloteMesuresCount) => {
          response.referentiels.piloteMesuresCount = piloteMesuresCount;
          return;
        })
    );

    await Promise.all(promises);

    return response;
  }
}
