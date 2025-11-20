import { Injectable } from '@nestjs/common';
import { filtersRequestSchema } from '@tet/backend/collectivites/recherches/filters.request';
import RecherchesService from '@tet/backend/collectivites/recherches/recherches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';

@Injectable()
export class RecherchesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: RecherchesService,
    private readonly permission: PermissionService
  ) {}

  router = this.trpc.router({
    collectivites: this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(({ input }) => {
        return this.service.collectivites(input);
      }),
    referentiels: this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(({ input }) => {
        return this.service.referentiels(input);
      }),
    plans: this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(({ input }) => {
        return this.service.plans(input);
      }),
  });
}
