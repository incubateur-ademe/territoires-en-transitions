import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { HandleMesureServicesService } from './handle-mesure-services.service';

const listServicesSchema = z.object({
  collectiviteId: z.number().int(),
  actionIds: z.array(z.string()).optional(),
});

const upsertServicesSchema = z.object({
  collectiviteId: z.number().int(),
  actionId: z.string(),
  services: z.array(
    z.object({
      serviceTagId: z.number().int(),
      tagId: z.number().int().optional(),
    })
  ),
});

const deleteServicesSchema = z.object({
  collectiviteId: z.number().int(),
  actionId: z.string(),
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
      .input(listServicesSchema)
      .query(({ input }) => {
        return this.service.listServices(input.collectiviteId, input.actionIds);
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
      .input(deleteServicesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deleteServices(
          input.collectiviteId,
          input.actionId,
          ctx.user
        );
      }),
  });
}
