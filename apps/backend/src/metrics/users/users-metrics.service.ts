import { Injectable, Logger } from '@nestjs/common';
import { PersonalMetricsOutput } from '@tet/backend/metrics/users/personal-metrics.output';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ListActionsService } from '@tet/backend/referentiels/list-actions/list-actions.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { ListIndicateursError } from '../../indicateurs/indicateurs/list-indicateurs/list-indicateurs.errors';
import { ListIndicateursService } from '../../indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import { catchDatabaseFailure } from '@tet/backend/utils/database/catch-database-failure';
import {
  getDataOrThrow,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { checkMetricsReadAllowed } from '../check-metrics-read-allowed';

@Injectable()
export class UsersMetricsService {
  private readonly logger = new Logger(UsersMetricsService.name);

  constructor(
    private readonly permissionsService: PermissionService,
    private readonly listFichesService: ListFichesService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly listActionsService: ListActionsService
  ) {}

  getMetrics(
    collectiviteId: number,
    user: AuthUser
  ): Promise<Result<PersonalMetricsOutput, ListIndicateursError>> {
    return catchDatabaseFailure(() => this.readMetrics(collectiviteId, user));
  }

  private async readMetrics(
    collectiviteId: number,
    user: AuthUser
  ): Promise<Result<PersonalMetricsOutput, ListIndicateursError>> {
    const permission = await checkMetricsReadAllowed({
      permissionService: this.permissionsService,
      user,
      collectiviteId,
    });
    if (!permission.success) return permission;

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
        .countPiloteFiches(collectiviteId, { user })
        .then((count) => {
          response.plans.piloteFichesCount = getDataOrThrow(count);
          return;
        })
    );

    promises.push(
      this.listFichesService
        .countPiloteSubFiches(collectiviteId, { user })
        .then((count) => {
          response.plans.piloteSubFichesCount = getDataOrThrow(count);
          return;
        })
    );

    promises.push(
      this.listFichesService
        .countPiloteFichesIndicateurs(collectiviteId, { user })
        .then((count) => {
          response.plans.piloteFichesIndicateursCount = getDataOrThrow(count);
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

    const [piloteCountResult] = await Promise.all([
      this.listIndicateursService.getMesIndicateursCount(
        { collectiviteId },
        user
      ),
      ...promises,
    ]);
    if (!piloteCountResult.success) return piloteCountResult;
    response.indicateurs.piloteCount = piloteCountResult.data;

    return success(response);
  }
}
