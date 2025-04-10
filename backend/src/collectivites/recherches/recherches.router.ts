import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import RecherchesService from '@/backend/collectivites/recherches/recherches.service';
import { filtersRequestSchema } from '@/backend/collectivites/recherches/filters.request';

@Injectable()
export class RecherchesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: RecherchesService,
    private readonly permission: PermissionService
  ) {}

  router = this.trpc.router({
    collectivites : this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(async ({input}) => {
        return await this.service.collectivites(input);
      }),
    referentiels : this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(async ({input}) => {
        return await this.service.referentiels(input);
      }),
    plans : this.trpc.authedProcedure
      .input(filtersRequestSchema)
      .query(async ({input}) => {
        return await this.service.plans(input);
      }),
  });
}
