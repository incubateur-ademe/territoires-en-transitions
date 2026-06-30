import { CollectivitesMetricsRouter } from '@tet/backend/metrics/collectivites/collectivites-metrics.router';
import { UsersMetricsRouter } from '@tet/backend/metrics/users/users-metrics.router';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly collectivitesMetricsRouter: CollectivitesMetricsRouter,
    private readonly usersMetricsRouter: UsersMetricsRouter
  ) {}

  router = this.trpc.router({
    collectivites: this.collectivitesMetricsRouter.router,
    users: this.usersMetricsRouter.router,
  });
}
