import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { FicheActionNoteService } from './service';
import { upsertFicheActionNoteSchema } from './table';

@Injectable()
export class FicheActionNoteRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: FicheActionNoteService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    notes: {
      list: this.trpc.authedProcedure
        .input(z.object({ ficheId: z.number() }))
        .query(async ({ ctx, input }) => {
          const result = await this.service.getNotes(input.ficheId, ctx.user);
          return this.getResultDataOrThrowError(result);
        }),
      upsert: this.trpc.authedProcedure
        .input(
          z.object({
            ficheId: z.number(),
            note: upsertFicheActionNoteSchema,
          })
        )
        .mutation(async ({ ctx, input }) => {
          const result = await this.service.upsertNotes(
            input.ficheId,
            [input.note],
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),
      delete: this.trpc.authedProcedure
        .input(z.object({ ficheId: z.number(), noteId: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const result = await this.service.deleteNote(
            input.ficheId,
            input.noteId,
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),
    },
  });
}
