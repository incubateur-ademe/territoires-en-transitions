import { AxeType } from '@/backend/plans/fiches/shared/models/axe.table';
import { PlanError } from '@/backend/plans/plans/plans.errors';
import { Result } from '@/backend/shared/types/result';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import {
  CreatePlanRequest,
  PlanNode,
  PlanReferentOrPilote,
  PlanType,
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
  UpdatePlanRequest,
} from '../plans.schema';

export interface PlansRepositoryInterface {
  create(
    plan: CreatePlanRequest,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeType, PlanError>>;

  update(
    planOrAxeId: number,
    planOrAxe: UpdatePlanRequest,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeType, PlanError>>;

  findById(
    planId: number
  ): Promise<Result<AxeType & { pilotes: PlanReferentOrPilote[] }, PlanError>>;

  list(
    collectiviteId: number,
    options?: {
      limit?: number;
      page?: number;
      sort?: {
        field: 'nom' | 'createdAt' | 'type';
        direction: 'asc' | 'desc';
      };
    }
  ): Promise<Result<{ plans: AxeType[]; totalCount: number }>>;

  getReferents(
    planId: number
  ): Promise<Result<PlanReferentOrPilote[], PlanError>>;

  setReferents(
    planId: number,
    referents: UpdatePlanReferentsSchema[],
    userId: string,
    tx?: Transaction
  ): Promise<Result<UpdatePlanReferentsSchema[], PlanError>>;

  getPilotes(
    planId: number
  ): Promise<Result<PlanReferentOrPilote[], PlanError>>;

  setPilotes(
    planId: number,
    pilotes: UpdatePlanPilotesSchema[],
    userId: string,
    tx?: Transaction
  ): Promise<Result<UpdatePlanPilotesSchema[], PlanError>>;

  getPlan({
    planId,
    user,
  }: {
    planId: number;
    user: AuthenticatedUser;
  }): Promise<Result<PlanNode[], PlanError>>;

  getPlanBasicInfo(
    planId: number
  ): Promise<Result<AxeType & { type: PlanType | null }, PlanError>>;

  deleteAxeAndChildrenAxes(
    axeId: number
  ): Promise<Result<{ impactedFicheIds: number[] }, PlanError>>;
}
