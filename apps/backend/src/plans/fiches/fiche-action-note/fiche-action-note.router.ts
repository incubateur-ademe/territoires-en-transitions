import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  ficheActionNoteDeleteInputSchema,
  ficheActionNoteListInputSchema,
  ficheActionNoteUpsertInputSchema,
} from './fiche-action-note.input';
import { FicheActionNoteService } from './fiche-action-note.service';

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
        .input(ficheActionNoteListInputSchema)
        .query(async ({ ctx, input }) => {
          const result = await this.service.getNotes(input.ficheId, ctx.user);
          return this.getResultDataOrThrowError(result);
        }),
      upsert: this.trpc.authedProcedure
        .input(ficheActionNoteUpsertInputSchema)
        .mutation(async ({ ctx, input }) => {
          const result = await this.service.upsertNotes(
            input.ficheId,
            [input.note],
            ctx.user
          );
          return this.getResultDataOrThrowError(result);
        }),
      delete: this.trpc.authedProcedure
        .input(ficheActionNoteDeleteInputSchema)
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
