import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { TRPCError } from '@trpc/server';
import { TRPC_ERROR_CODE_KEY } from '@trpc/server/unstable-core-do-not-import';
import { PlanErrorType } from './plans.errors';
import {
  createAxeRequestSchema,
  createPlanSchema,
  deleteAxeSchema,
  deletePlanSchema,
  getDetailedPlansSchema,
  getPlanSchema,
  updateAxeRequestSchema,
  updatePlanSchema,
} from './plans.schema';
import { PlanService } from './plans.service';

@Injectable()
export class PlanRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly planService: PlanService
  ) {}

  private readonly errorMessages: Record<string, string> = {
    [PlanErrorType.PLAN_NOT_FOUND]: "Le plan demandé n'existe pas",
    [PlanErrorType.UNAUTHORIZED]: "Vous n'avez pas les permissions nécessaires",
    [PlanErrorType.DATABASE_ERROR]:
      "Une erreur de base de données s'est produite",
    [PlanErrorType.SERVER_ERROR]: "Une erreur serveur s'est produite",
  };

  private getErrorMessage(errorKey: string): string {
    return (
      this.errorMessages[errorKey] || "Une erreur inattendue s'est produite"
    );
  }

  private handleServiceError(result: {
    success: false;
    error: PlanErrorType;
  }): never {
    const { error } = result;

    const errors: Record<
      PlanErrorType,
      {
        code: TRPC_ERROR_CODE_KEY;
        message: string;
      }
    > = {
      [PlanErrorType.PLAN_NOT_FOUND]: {
        code: 'NOT_FOUND',
        message: this.getErrorMessage(PlanErrorType.PLAN_NOT_FOUND),
      },
      [PlanErrorType.SERVER_ERROR]: {
        code: 'INTERNAL_SERVER_ERROR',
        message: this.getErrorMessage(PlanErrorType.SERVER_ERROR),
      },
      [PlanErrorType.UNAUTHORIZED]: {
        code: 'FORBIDDEN',
        message: this.getErrorMessage(PlanErrorType.UNAUTHORIZED),
      },
      [PlanErrorType.DATABASE_ERROR]: {
        code: 'INTERNAL_SERVER_ERROR',
        message: this.getErrorMessage(PlanErrorType.DATABASE_ERROR),
      },
    };

    throw new TRPCError(errors[error]);
  }

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createPlanSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planService.createPlan(input, ctx.user);

        if (!result.success) {
          this.handleServiceError(result);
        }

        return result.data;
      }),

    update: this.trpc.authedProcedure
      .input(updatePlanSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planService.updatePlan(input, ctx.user);

        if (!result.success) {
          this.handleServiceError(result);
        }

        return result.data;
      }),

    get: this.trpc.authedProcedure
      .input(getPlanSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.planService.findById(input.planId, ctx.user);
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),

    getDetailedPlans: this.trpc.authedProcedure
      .input(getDetailedPlansSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.planService.getDetailedPlans(
          input.collectiviteId,
          ctx.user,
          {
            limit: input.limit,
            page: input.page,
            sort: input.sort,
          }
        );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),

    createAxe: this.trpc.authedProcedure
      .input(createAxeRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planService.upsertAxe(input, ctx.user);
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),

    updateAxe: this.trpc.authedProcedure
      .input(updateAxeRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planService.upsertAxe(input, ctx.user);
        if (!result.success) {
          this.handleServiceError(result);
        }
        return result.data;
      }),

    deleteAxe: this.trpc.authedProcedure
      .input(deleteAxeSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planService.deleteAxe(input.axeId, ctx.user);
        if (!result.success) {
          this.handleServiceError(result);
        }
        return { success: true };
      }),

    deletePlan: this.trpc.authedProcedure
      .input(deletePlanSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.planService.deletePlan(
          input.planId,
          ctx.user
        );
        if (!result.success) {
          this.handleServiceError(result);
        }
        return { success: true };
      }),
  });
}
