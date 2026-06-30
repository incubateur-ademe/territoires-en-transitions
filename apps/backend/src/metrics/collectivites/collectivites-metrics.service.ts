import { Injectable, Logger } from '@nestjs/common';
import { CollectiviteMetricsOutput } from '@tet/backend/metrics/collectivites/collectivite-metrics.output';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import PlanActionsService from '@tet/backend/plans/fiches/plan-actions.service';
import { ListLabellisationsService } from '@tet/backend/referentiels/labellisations/list-labellisations.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { ListIndicateursService } from '../../indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import { LabellisationRecord } from '../../referentiels/labellisations/list-labellisations.api-response';

@Injectable()
export class CollectivitesMetricsService {
  private readonly logger = new Logger(CollectivitesMetricsService.name);

  constructor(
    private readonly permissionsService: PermissionService,
    private readonly listLabellisationService: ListLabellisationsService,
    private readonly planActionsService: PlanActionsService,
    private readonly listFichesService: ListFichesService,
    private readonly listIndicateursService: ListIndicateursService
  ) {}

  /**
   * Fetch les metriques du tableau de bord pour une collectivité.
   */
  async getMetrics(
    collectiviteId: number,
    user: AuthUser
  ): Promise<CollectiviteMetricsOutput> {
    await this.permissionsService.isAllowed(
      user,
      'collectivites.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des métriques globales pour la collectivité ${collectiviteId}`
    );

    const response: CollectiviteMetricsOutput = {
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
      this.listIndicateursService
        .getFavorisCount({ collectiviteId }, user)
        .then((favorisCount) => {
          response.indicateurs.favoris = favorisCount;
          return;
        })
    );

    promises.push(
      this.listIndicateursService
        .getPersonnalisesCount({ collectiviteId }, user)
        .then((personnalisesCount) => {
          response.indicateurs.personnalises = personnalisesCount;
          return;
        })
    );

    await Promise.all(promises);

    return response;
  }
}
