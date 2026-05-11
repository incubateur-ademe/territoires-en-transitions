import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ListPlanTypesService } from './list-plan-types.service';

@Injectable()
export class ListPlanTypesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listPlanTypesService: ListPlanTypesService
  ) {}

  router = this.trpc.router({
    listTypes: this.trpc.authedProcedure.query(async () => {
      return this.listPlanTypesService.listPlanTypes();
    }),
  });
}
