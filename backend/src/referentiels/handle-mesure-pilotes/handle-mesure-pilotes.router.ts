import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { HandleMesurePilotesService } from './handle-mesure-pilotes.service';

const listPilotesSchema = z.object({
  collectiviteId: z.number().int(),
  actionIds: z.array(z.string()).optional(),
});

const upsertPilotesSchema = z.object({
  collectiviteId: z.number().int(),
  actionId: z.string(),
  pilotes: z.array(
    z.object({
      userId: z.string().optional().nullable(),
      tagId: z.number().int().optional().nullable(),
    })
  ),
});

const deletePilotesSchema = z.object({
  collectiviteId: z.number().int(),
  actionId: z.string(),
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
        return this.service.listPilotes(input.collectiviteId, input.actionIds);
      }),
    // listPilotes: this.trpc.authedProcedure
    //   .input(actionIdentifierSchema)
    //   .query(({ input }) => {
    //     return this.service.listPilotes(input.collectiviteId, input.actionId);
    //   }),

    /**
     * Retrieves the list of pilots for multiple actions in a single batch request
     */
    // batchListPilotes: this.trpc.authedProcedure
    //   .input(batchListPilotesSchema)
    //   .query(({ input }) => {
    //     return this.service.batchListPilotes(
    //       input.collectiviteId,
    //       input.actionIds
    //     );
    //   }),

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
      .input(deletePilotesSchema)
      .mutation(({ input, ctx }) => {
        return this.service.deletePilotes(
          input.collectiviteId,
          input.actionId,
          ctx.user
        );
      }),
  });
}
