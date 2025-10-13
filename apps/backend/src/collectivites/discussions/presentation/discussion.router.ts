import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server';
import { DiscussionApplicationService } from '../application/discussion-application.service';
import {
  DiscussionError,
  DiscussionErrorEnum,
} from '../domain/discussion.errors';
import {
  createDiscussionRequestSchema,
  deleteDiscussionAndDiscussionMessageRequestSchema,
  deleteDiscussionMessageRequestSchema,
  listDiscussionsRequestSchema,
  updateDiscussionMessageRequestSchema,
  updateDiscussionRequestSchema,
} from '../presentation/discussion.schemas';

@Injectable()
export class DiscussionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly discussionApplicationService: DiscussionApplicationService
  ) {}

  private readonly errorMessages: Record<DiscussionError, string> = {
    [DiscussionErrorEnum.UNAUTHORIZED]:
      "Vous n'avez pas les permissions nécessaires",
    [DiscussionErrorEnum.DATABASE_ERROR]:
      "Une erreur de base de données s'est produite",
    [DiscussionErrorEnum.FORBIDDEN]:
      "Vous n'avez pas les permissions nécessaires",
    [DiscussionErrorEnum.INTERNAL_SERVER_ERROR]:
      "Une erreur serveur s'est produite",
    [DiscussionErrorEnum.SERVER_ERROR]: "Une erreur serveur s'est produite",
    [DiscussionErrorEnum.FILTERS_NOT_VALID]:
      'Les filtres fournis ne sont pas valides',
    [DiscussionErrorEnum.OPTIONS_NOT_VALID]:
      'Les options fournies ne sont pas valides',
    [DiscussionErrorEnum.NOT_FOUND]: "La discussion demandée n'existe pas",
    [DiscussionErrorEnum.BAD_REQUEST]:
      'Les paramètres fournis ne sont pas valides',
  };

  private getErrorMessage(errorKey: DiscussionError): string {
    return (
      this.errorMessages[errorKey] || "Une erreur inattendue s'est produite"
    );
  }

  private handleServiceError(result: {
    success: false;
    error: DiscussionError;
  }): never {
    const { error } = result;

    const errorCodeMapper: Record<DiscussionError, TRPC_ERROR_CODE_KEY> = {
      [DiscussionErrorEnum.UNAUTHORIZED]: 'FORBIDDEN',
      [DiscussionErrorEnum.DATABASE_ERROR]: 'INTERNAL_SERVER_ERROR',
      [DiscussionErrorEnum.SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
      [DiscussionErrorEnum.FILTERS_NOT_VALID]: 'BAD_REQUEST',
      [DiscussionErrorEnum.OPTIONS_NOT_VALID]: 'BAD_REQUEST',
      [DiscussionErrorEnum.NOT_FOUND]: 'NOT_FOUND',
      [DiscussionErrorEnum.BAD_REQUEST]: 'BAD_REQUEST',
      [DiscussionErrorEnum.FORBIDDEN]: 'FORBIDDEN',
      [DiscussionErrorEnum.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    throw new TRPCError({
      code: errorCodeMapper[error],
      message: this.getErrorMessage(error),
    });
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
        const result =
          await this.discussionApplicationService.listDiscussionsWithMessages(
            input,
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
        const result = await this.discussionApplicationService.updateDiscussion(
          input,
          ctx.user
        );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),
    updateMessage: this.trpc.authedProcedure
      .input(updateDiscussionMessageRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.discussionApplicationService.updateDiscussionMessage(
            input,
            ctx.user
          );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),
    delete: this.trpc.authedProcedure
      .input(deleteDiscussionAndDiscussionMessageRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.discussionApplicationService.deleteDiscussionAndDiscussionMessage(
            input,
            ctx.user
          );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return { success: true };
      }),
    deleteMessage: this.trpc.authedProcedure
      .input(deleteDiscussionMessageRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.discussionApplicationService.deleteDiscussionMessage(
            input,
            ctx.user
          );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return { success: true };
      }),
  });
}
