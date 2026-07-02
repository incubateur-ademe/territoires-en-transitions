import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { actionIdSchema } from '@tet/domain/referentiels';
import { z } from 'zod';
import { handleMesureServicesErrorConfig } from './handle-mesure-services.errors';
import { HandleMesureServicesService } from './handle-mesure-services.service';

const upsertServicesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: actionIdSchema,
  services: z.array(
    z.object({
      serviceTagId: z.int(),
      tagId: z.int().optional(),
    })
  ),
});

const deleteServicesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: actionIdSchema,
});

@Injectable()
export class HandleMesuresServicesRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    handleMesureServicesErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleMesureServicesService
  ) {}

  router = this.trpc.router({
    upsertServices: this.trpc.authedProcedure
      .input(upsertServicesSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.upsertServices(
          input.collectiviteId,
          input.mesureId,
          input.services,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),

    deleteServices: this.trpc.authedProcedure
      .input(deleteServicesSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.deleteServices(
          input.collectiviteId,
          input.mesureId,
          ctx.user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
