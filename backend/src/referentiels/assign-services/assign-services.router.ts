import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AssignServicesService } from './assign-services.service';

const actionIdentifierSchema = z.object({
  collectiviteId: z.number().int(),
  actionId: z.string(),
});

const upsertServicesSchema = actionIdentifierSchema.extend({
  services: z.array(
    z.object({
      serviceTagId: z.number().int(),
      tagId: z.number().int().optional(),
    })
  ),
});

@Injectable()
export class AssignServicesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: AssignServicesService
  ) {}

  router = this.trpc.router({
    listServices: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .query(({ input }) => {
        return this.service.listServices(input.collectiviteId, input.actionId);
      }),

    upsertServices: this.trpc.authedProcedure
      .input(upsertServicesSchema)
      .mutation(({ input }) => {
        return this.service.upsertServices(
          input.collectiviteId,
          input.actionId,
          input.services
        );
      }),

    deleteServices: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .mutation(({ input }) => {
        return this.service.deleteServices(
          input.collectiviteId,
          input.actionId
        );
      }),
  });
}
