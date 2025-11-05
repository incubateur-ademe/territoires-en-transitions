import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { actionIdSchema } from '@/domain/referentiels';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { HandleMesurePilotesService } from './handle-mesure-pilotes.service';

const listPilotesSchema = z.object({
  collectiviteId: z.int(),
  mesureIds: z.array(actionIdSchema).optional(),
});

const upsertPilotesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: actionIdSchema,
  pilotes: z.array(
    z.object({
      userId: z.string().optional().nullable(),
      tagId: z.int().optional().nullable(),
    })
  ),
});

const deletePilotesSchema = z.object({
  collectiviteId: z.int(),
  mesureId: actionIdSchema,
});

@Injectable()
export class HandleMesurePilotesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: HandleMesurePilotesService
  ) {}

  router = this.trpc.router({
    listPilotes: this.trpc.authedProcedure
      .input(listPilotesSchema)
      .query(({ input }) => {
        return this.service.listPilotes(input.collectiviteId, input.mesureIds);
      }),

    upsertPilotes: this.trpc.authedProcedure
      .input(upsertPilotesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertPilotes(
          input.collectiviteId,
          input.mesureId,
          input.pilotes,
          ctx.user
        );
      }),

    deletePilotes: this.trpc.authedProcedure
      .input(deletePilotesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deletePilotes(
          input.collectiviteId,
          input.mesureId,
          ctx.user
        );
      }),
  });
}
