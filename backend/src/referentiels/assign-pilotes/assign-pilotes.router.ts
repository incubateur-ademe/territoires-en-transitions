import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AssignPilotesService } from './assign-pilotes.service';

const baseCollectiviteSchema = z.object({
  collectiviteId: z.number().int(),
});

const actionIdentifierSchema = baseCollectiviteSchema.extend({
  actionId: z.string(),
});

const batchListPilotesSchema = baseCollectiviteSchema.extend({
  actionIds: z.array(z.string()),
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
    /**
     * Retrieves the list of pilots assigned to an action
     */
    listPilotes: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .query(({ input }) => {
        return this.service.listPilotes(input.collectiviteId, input.actionId);
      }),

    /**
     * Retrieves the list of pilots for multiple actions in a single batch request
     */
    batchListPilotes: this.trpc.authedProcedure
      .input(batchListPilotesSchema)
      .query(({ input }) => {
        return this.service.batchListPilotes(
          input.collectiviteId,
          input.actionIds
        );
      }),

    /**
     * Creates or updates the pilots assigned to an action
     */
    upsertPilotes: this.trpc.authedProcedure
      .input(upsertPilotesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertPilotes(
          input.collectiviteId,
          input.actionId,
          input.pilotes,
          ctx.user
        );
      }),

    /**
     * Deletes all pilots assigned to an action
     * @param {Object} input - Input parameters
     * @param {number} input.collectiviteId - The collectivity identifier
     * @param {string} input.actionId - The action identifier
     * @returns {Promise<void>}
     */
    deletePilotes: this.trpc.authedProcedure
      .input(actionIdentifierSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deletePilotes(
          input.collectiviteId,
          input.actionId,
          ctx.user
        );
      }),
  });
}
