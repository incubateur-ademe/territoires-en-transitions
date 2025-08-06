
import { updateIndicateurDefinitionRequestSchema } from '@/backend/indicateurs/definitions/update-indicateurs-definitions/update-indicateurs-definitions.request';
import { UpdateIndicateursDefinitionsService } from '@/backend/indicateurs/definitions/update-indicateurs-definitions/update-indicateurs-definitions.service';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';

@Injectable()
export class UpdateIndicateursDefinitionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly updateService: UpdateIndicateursDefinitionsService
  ) { }

  router = this.trpc.router({
    updateIndicateur: this.trpc.authedProcedure
      .input(
        z.object({
          indicateurId: z.number(),
          indicateurFields: updateIndicateurDefinitionRequestSchema,
        })
      )
      .mutation(({ ctx, input }) => {
        return this.updateService.updateIndicateur({ ...input, user: ctx.user });
      }),
  });

  createCaller = this.trpc.createCallerFactory(this.router);
}
