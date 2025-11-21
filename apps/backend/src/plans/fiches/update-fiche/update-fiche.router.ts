import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/unstable-core-do-not-import';
import z from 'zod';
import { UpdateFicheErrorType } from './update-fiche.errors';
import { updateFicheRequestSchema } from './update-fiche.request';
import UpdateFicheService from './update-fiche.service';

const updateFicheInput = z.object({
  ficheId: z.number(),
  ficheFields: updateFicheRequestSchema,
});

@Injectable()
export class UpdateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateFicheService
  ) {}

  private readonly errorMessages: Record<string, string> = {
    [UpdateFicheErrorType.SELF_REFERENCE]:
      'La fiche ne peut pas se référencer elle-même',
    [UpdateFicheErrorType.PARENT_NOT_FOUND]:
      'La fiche ne peut pas référencer une fiche inexistante',
    [UpdateFicheErrorType.FICHE_NOT_FOUND]: 'Fiche non trouvée',
  };

  private getErrorMessage(errorKey: string): string {
    return (
      this.errorMessages[errorKey] || "Une erreur inattendue s'est produite"
    );
  }

  private handleServiceError(result: {
    success: false;
    error: UpdateFicheErrorType;
  }): never {
    const { error } = result;

    const errors: Record<
      UpdateFicheErrorType,
      {
        code: TRPC_ERROR_CODE_KEY;
        message: string;
      }
    > = {
      [UpdateFicheErrorType.SELF_REFERENCE]: {
        code: 'BAD_REQUEST',
        message: this.getErrorMessage(UpdateFicheErrorType.SELF_REFERENCE),
      },
      [UpdateFicheErrorType.PARENT_NOT_FOUND]: {
        code: 'BAD_REQUEST',
        message: this.getErrorMessage(UpdateFicheErrorType.PARENT_NOT_FOUND),
      },
      [UpdateFicheErrorType.FICHE_NOT_FOUND]: {
        code: 'NOT_FOUND',
        message: this.getErrorMessage(UpdateFicheErrorType.FICHE_NOT_FOUND),
      },
    };

    throw new TRPCError(errors[error]);
  }

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(updateFicheInput)
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot update fiche');
        }
        const result = await this.service.updateFiche({
          ...input,
          user: ctx.user,
        });

        if (!result.success) {
          this.handleServiceError(result);
        }

        return result.data;
      }),
  });
}
