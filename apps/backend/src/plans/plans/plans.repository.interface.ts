import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  AxeLight,
  CreatePlanRequest,
  PlanNode,
  PlanReferentOrPilote,
  PlanType,
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
  UpdatePlanRequest,
} from '@tet/domain/plans';
import { PlanError } from './plans.errors';
import { Result } from './plans.result';

export interface PlansRepositoryInterface {
  create(
    plan: CreatePlanRequest,
    userId: string,
    tx?: Transaction
  ): Promise<Result<AxeLight, PlanError>>;

  update(
    planOrAxeId: number,
    planOrAxe: UpdatePlanRequest,
    userId: string
  ): Promise<Result<AxeLight, PlanError>>;

  findById(
    planId: number
  ): Promise<Result<AxeLight & { pilotes: PlanReferentOrPilote[] }, PlanError>>;

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
  ): Promise<Result<{ plans: AxeLight[]; totalCount: number }>>;

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
  ): Promise<Result<AxeLight & { type: PlanType | null }, PlanError>>;

  deleteAxeAndChildrenAxes(
    axeId: number
  ): Promise<Result<{ impactedFicheIds: number[] }, PlanError>>;
}
