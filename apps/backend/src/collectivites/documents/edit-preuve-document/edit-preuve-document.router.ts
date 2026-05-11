import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { preuveBaseSchema } from '@tet/domain/collectivites';
import z from 'zod';
import { editPreuveDocumentErrorConfig } from './edit-preuve-document.errors';
import {
  removePreuveInputSchema,
  updatePreuveInputSchema,
} from './edit-preuve-document.input';
import { EditPreuveDocumentService } from './edit-preuve-document.service';

@Injectable()
export class EditPreuveDocumentRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly editPreuveDocumentService: EditPreuveDocumentService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    editPreuveDocumentErrorConfig
  );

  router = this.trpc.router({
    updatePreuve: this.trpc.authedProcedure
      .input(updatePreuveInputSchema)
      .output(preuveBaseSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.editPreuveDocumentService.updatePreuve(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),

    removePreuve: this.trpc.authedProcedure
      .input(removePreuveInputSchema)
      .output(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.editPreuveDocumentService.removePreuve(
          input,
          user
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
