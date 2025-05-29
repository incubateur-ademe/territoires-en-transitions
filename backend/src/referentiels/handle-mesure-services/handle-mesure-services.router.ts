import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { HandleMesureServicesService } from './handle-mesure-services.service';

const baseCollectiviteSchema = z.object({
  collectiviteId: z.number().int(),
});

const actionIdentifierSchema = baseCollectiviteSchema.extend({
  actionId: z.string(),
});

const batchListServicesSchema = baseCollectiviteSchema.extend({
  actionIds: z.array(z.string()),
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
export class HandleMesuresServicesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleMesureServicesService
  ) {}

  router = this.trpc.router({
    /**
     * Retrieves the list of services assigned to an action
     */
    listServices: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .query(({ input }) => {
        return this.service.listServices(input.collectiviteId, input.actionId);
      }),

    /**
     * Retrieves the list of services for multiple actions in a single batch request
     */
    batchListServices: this.trpc.authedProcedure
      .input(batchListServicesSchema)
      .query(({ input }) => {
        return this.service.batchListServices(
          input.collectiviteId,
          input.actionIds
        );
      }),

    /**
     * Creates or updates the services assigned to an action
     */
    upsertServices: this.trpc.authedProcedure
      .input(upsertServicesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertServices(
          input.collectiviteId,
          input.actionId,
          input.services,
          ctx.user
        );
      }),

    deleteServices: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deleteServices(
          input.collectiviteId,
          input.actionId,
          ctx.user
        );
      }),
  });
}
