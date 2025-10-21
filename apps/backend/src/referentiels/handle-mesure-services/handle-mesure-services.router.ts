import { mesureIdSchema } from '@/backend/referentiels/models/action-definition.table';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { HandleMesureServicesService } from './handle-mesure-services.service';

const listServicesSchema = z.object({
  collectiviteId: z.int(),
  mesureIds: z.array(mesureIdSchema).optional(),
});

const upsertServicesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: mesureIdSchema,
  services: z.array(
    z.object({
      serviceTagId: z.int(),
      tagId: z.int().optional(),
    })
  ),
});

const deleteServicesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: mesureIdSchema,
});

@Injectable()
export class HandleMesuresServicesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleMesureServicesService
  ) {}

  router = this.trpc.router({
    listServices: this.trpc.authedProcedure
      .input(listServicesSchema)
      .query(({ input }) => {
        return this.service.listServices(input.collectiviteId, input.mesureIds);
      }),

    upsertServices: this.trpc.authedProcedure
      .input(upsertServicesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertServices(
          input.collectiviteId,
          input.mesureId,
          input.services,
          ctx.user
        );
      }),

    deleteServices: this.trpc.authedProcedure
      .input(deleteServicesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deleteServices(
          input.collectiviteId,
          input.mesureId,
          ctx.user
        );
      }),
  });
}
