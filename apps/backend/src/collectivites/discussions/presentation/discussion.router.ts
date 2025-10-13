import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server';
import { DiscussionApplicationService } from '../application/discussion-application.service';
import {
  DiscussionError,
  DiscussionErrorEnum,
} from '../domain/discussion.type';
import {
  createDiscussionRequestSchema,
  deleteDiscussionMessageRequestSchema,
  listDiscussionsRequestSchema,
  updateDiscussionRequestSchema,
} from '../presentation/discussion.shemas';

@Injectable()
export class DiscussionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly discussionApplicationService: DiscussionApplicationService
  ) {}

  private readonly errorMessages: Record<string, string> = {
    [DiscussionErrorEnum.UNAUTHORIZED]:
      "Vous n'avez pas les permissions nécessaires",
    [DiscussionErrorEnum.DATABASE_ERROR]:
      "Une erreur de base de données s'est produite",
    [DiscussionErrorEnum.SERVER_ERROR]: "Une erreur serveur s'est produite",
    [DiscussionErrorEnum.FILTERS_NOT_VALID]:
      'Les filtres fournis ne sont pas valides',
    [DiscussionErrorEnum.OPTIONS_NOT_VALID]:
      'Les options fournies ne sont pas valides',
    [DiscussionErrorEnum.NOT_FOUND]: "La discussion demandée n'existe pas",
  };

  private getErrorMessage(errorKey: string): string {
    return (
      this.errorMessages[errorKey] || "Une erreur inattendue s'est produite"
    );
  }

  private handleServiceError(result: {
    success: false;
    error: DiscussionError;
  }): never {
    const { error } = result;

    const errors: Record<
      DiscussionError,
      {
        code: TRPC_ERROR_CODE_KEY;
        message: string;
      }
    > = {
      [DiscussionErrorEnum.UNAUTHORIZED]: {
        code: 'FORBIDDEN',
        message: this.getErrorMessage(DiscussionErrorEnum.UNAUTHORIZED),
      },
      [DiscussionErrorEnum.DATABASE_ERROR]: {
        code: 'INTERNAL_SERVER_ERROR',
        message: this.getErrorMessage(DiscussionErrorEnum.DATABASE_ERROR),
      },
      [DiscussionErrorEnum.SERVER_ERROR]: {
        code: 'INTERNAL_SERVER_ERROR',
        message: this.getErrorMessage(DiscussionErrorEnum.SERVER_ERROR),
      },
      [DiscussionErrorEnum.FILTERS_NOT_VALID]: {
        code: 'BAD_REQUEST',
        message: this.getErrorMessage(DiscussionErrorEnum.FILTERS_NOT_VALID),
      },
      [DiscussionErrorEnum.OPTIONS_NOT_VALID]: {
        code: 'BAD_REQUEST',
        message: this.getErrorMessage(DiscussionErrorEnum.OPTIONS_NOT_VALID),
      },
      NOT_FOUND: {
        code: 'NOT_FOUND',
        message: this.getErrorMessage(DiscussionErrorEnum.NOT_FOUND),
      },
    };

    throw new TRPCError(errors[error]);
  }

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createDiscussionRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.discussionApplicationService.createDiscussion(
          input,
          ctx.user
        );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),
    list: this.trpc.authedProcedure
      .input(listDiscussionsRequestSchema)
      .query(async ({ input, ctx }) => {
        const { collectiviteId, referentielId, filters, options } = input;
        const result =
          await this.discussionApplicationService.listDiscussionsWithMessages(
            {
              collectiviteId,
              referentielId,
              filters,
              options: options,
            },
            ctx.user
          );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),
    update: this.trpc.authedProcedure
      .input(updateDiscussionRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const { discussionId, status, collectiviteId } = input;
        const result = await this.discussionApplicationService.updateDiscussion(
          discussionId,
          status,
          collectiviteId,
          ctx.user
        );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),
    delete: this.trpc.authedProcedure
      .input(deleteDiscussionMessageRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const { discussionMessageId, collectiviteId } = input;
        const result =
          await this.discussionApplicationService.deleteDiscussionMessage(
            discussionMessageId,
            collectiviteId,
            ctx.user
          );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return { success: true };
      }),
  });
}
