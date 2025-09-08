import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
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
      .mutation(({ ctx, input }) => {
        return this.updateService.updateDefinition(input, ctx.user);
      }),

    delete: this.trpc.authedProcedure
      .input(deleteIndicateurDefinitionInputSchema)
      .mutation(({ ctx, input }) => {
        return this.deleteService.deleteIndicateurPerso(input, ctx.user);
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
