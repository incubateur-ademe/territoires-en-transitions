import { filtersRequestSchema } from '@/backend/collectivites/recherches/filters.request';
import RecherchesService from '@/backend/collectivites/recherches/recherches.service';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';

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
