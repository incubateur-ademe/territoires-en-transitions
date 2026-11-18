import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { upsertSuiviPlanModuleInputSchema } from '@tet/domain/metrics';
import { suiviPlanModulesErrorConfig } from './suivi-plan-modules.errors';
import {
  deleteSuiviPlanModuleInputSchema,
  listSuiviPlanModulesInputSchema,
} from './suivi-plan-modules.input';
import { SuiviPlanModulesService } from './suivi-plan-modules.service';

@Injectable()
export class SuiviPlanModulesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: SuiviPlanModulesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    suiviPlanModulesErrorConfig
  );

  router = this.trpc.router({
    listModules: this.trpc.authedProcedure
      .input(listSuiviPlanModulesInputSchema)
      .query(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.listModules(input, { user: ctx.user })
        )
      ),

    upsertModule: this.trpc.authedProcedure
      .input(upsertSuiviPlanModuleInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.upsertModule(input, { user: ctx.user })
        )
      ),

    deleteModule: this.trpc.authedProcedure
      .input(deleteSuiviPlanModuleInputSchema)
      .mutation(async ({ input, ctx }) =>
        this.getResultDataOrThrowError(
          await this.service.deleteModule(input, { user: ctx.user })
        )
      ),
  });
}
