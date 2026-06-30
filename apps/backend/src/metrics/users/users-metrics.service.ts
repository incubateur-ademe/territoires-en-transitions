import { Injectable, Logger } from '@nestjs/common';
import { PersonalMetricsOutput } from '@tet/backend/metrics/users/personal-metrics.output';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ListActionsService } from '@tet/backend/referentiels/list-actions/list-actions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { ResourceType } from '@tet/domain/users';
import { ListIndicateursService } from '../../indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';

@Injectable()
export class UsersMetricsService {
  private readonly logger = new Logger(UsersMetricsService.name);

  constructor(
    private readonly permissionsService: PermissionService,
    private readonly listFichesService: ListFichesService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly listActionsService: ListActionsService
  ) {}

  async getMetrics(
    collectiviteId: number,
    user: AuthUser
  ): Promise<PersonalMetricsOutput> {
    await this.permissionsService.isAllowed(
      user,
      'collectivites.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    this.logger.log(
      `Récupération des métriques personnelles pour la collectivité ${collectiviteId} et l'utilisateur ${user.id}`
    );

    const response: PersonalMetricsOutput = {
      plans: {
        piloteSubFichesCount: 0,
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
      this.listFichesService
        .countPiloteFiches(collectiviteId, user)
        .then((count) => {
          response.plans.piloteFichesCount = count;
          return;
        })
    );

    promises.push(
      this.listFichesService
        .countPiloteSubFiches(collectiviteId, user)
        .then((count) => {
          response.plans.piloteSubFichesCount = count;
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
      this.listIndicateursService
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
