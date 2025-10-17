import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { TRPC_ERROR_CODE_KEY, TRPCError } from '@trpc/server';
import { DiscussionApplicationService } from '../application/discussion-application.service';
import {
  DiscussionError,
  DiscussionErrorEnum,
} from '../domain/discussion.type';
import { createDiscussionRequestSchema } from '../presentation/discussion.shemas';

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
      [DiscussionErrorEnum.DISCUSSION_NOT_FOUND]: {
        code: 'NOT_FOUND',
        message: this.getErrorMessage(DiscussionErrorEnum.DISCUSSION_NOT_FOUND),
      },
    };

    throw new TRPCError(errors[error]);
  }

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createDiscussionRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result =
          await this.discussionApplicationService.insertDiscussionMessage(
            input,
            ctx.user
          );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),
  });
}
