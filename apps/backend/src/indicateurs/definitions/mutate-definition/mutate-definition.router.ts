import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import CreateDefinitionService from './create-definition.service';
import { DeleteDefinitionService } from './delete-definition.service';
import {
  createIndicateurDefinitionInputSchema,
  deleteIndicateurDefinitionInputSchema,
  updateIndicateurDefinitionInputSchema,
} from './mutate-definition.input';
import { UpdateDefinitionService } from './update-definition.service';

@Injectable()
export class MutateDefinitionRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  constructor(
    private readonly trpc: TrpcService,
    private readonly createService: CreateDefinitionService,
    private readonly updateService: UpdateDefinitionService,
    private readonly deleteService: DeleteDefinitionService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createIndicateurDefinitionInputSchema)
      .mutation(({ ctx, input }) => {
        return this.createService.createIndicateurPerso(input, ctx.user);
      }),

    update: this.trpc.authedProcedure
      .input(updateIndicateurDefinitionInputSchema)
      .mutation(async ({ ctx, input }) => {
        const result = await this.updateService.updateDefinition(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),

    delete: this.trpc.authedProcedure
      .input(deleteIndicateurDefinitionInputSchema)
      .mutation(({ ctx, input }) => {
        return this.deleteService.deleteIndicateurPerso(input, ctx.user);
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
