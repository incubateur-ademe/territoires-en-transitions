import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { AssignPilotesService } from './assign-pilotes.service';
import { z } from 'zod';

const actionIdentifierSchema = z.object({
  collectiviteId: z.number().int(),
  actionId: z.string(),
});

const upsertPilotesSchema = actionIdentifierSchema.extend({
  pilotes: z.array(
    z.object({
      userId: z.string().optional(),
      tagId: z.number().int().optional(),
    })
  ),
});

@Injectable()
export class AssignPilotesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: AssignPilotesService
  ) {}

  router = this.trpc.router({
    listPilotes: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .query(({ input }) => {
        return this.service.listPilotes(input.collectiviteId, input.actionId);
      }),

    upsertPilotes: this.trpc.authedProcedure
      .input(upsertPilotesSchema)
      .mutation(({ input }) => {
        return this.service.upsertPilotes(
          input.collectiviteId,
          input.actionId,
          input.pilotes
        );
      }),

    deletePilotes: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .mutation(({ input }) => {
        return this.service.deletePilotes(input.collectiviteId, input.actionId);
      }),
  });
}
