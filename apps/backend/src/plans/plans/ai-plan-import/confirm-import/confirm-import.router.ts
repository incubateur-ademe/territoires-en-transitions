import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { TRPCError } from '@trpc/server';
import { ConfirmError } from './confirm-import.errors';
import { confirmImportInputSchema } from './confirm-import.input';
import { confirmImportOutputSchema } from './confirm-import.output';
import { ConfirmImportService } from './confirm-import.service';
import { LineValidationError } from './draft-to-import-plan-input';

@Injectable()
export class ConfirmImportRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly confirmImportService: ConfirmImportService
  ) {}

  router = this.trpc.router({
    confirmAiImport: this.trpc.authedProcedure
      .input(confirmImportInputSchema)
      .output(confirmImportOutputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.confirmImportService.confirm({ input, user });
        if (!result.success) {
          throw confirmErrorToTrpcError(result.error);
        }
        return result.data;
      }),
  });
}

const confirmErrorToTrpcError = (error: ConfirmError): TRPCError => {
  switch (error.kind) {
    case 'job_not_found':
      return new TRPCError({
        code: 'NOT_FOUND',
        message: "Le job d'import demandé n'existe pas",
      });
    case 'forbidden':
      return new TRPCError({
        code: 'FORBIDDEN',
        message: "Vous n'avez pas le droit de confirmer cet import",
      });
    case 'not_confirmable':
      return new TRPCError({
        code: 'CONFLICT',
        message: `Le brouillon n'est pas confirmable (statut ${error.status})`,
      });
    case 'no_draft':
      return new TRPCError({
        code: 'CONFLICT',
        message: 'Le job ne contient aucun brouillon à confirmer',
      });
    case 'invalid_lines':
      return new TRPCError({
        code: 'BAD_REQUEST',
        message: lineErrorsToMessage(error.errors),
      });
    case 'persistence_failed':
      return new TRPCError({
        code: error.isClient ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
  }
};

const lineErrorsToMessage = (errors: LineValidationError[]): string =>
  errors
    .map(
      (error) =>
        `Action "${error.titre}" (ligne ${error.actionIndex + 1}) : ${
          error.message
        }`
    )
    .join('\n');
