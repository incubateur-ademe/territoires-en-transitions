import { AuthenticatedUser } from '@/backend/users/index-domain';
import {
  CreatePlanRequest,
  PlanNode,
  PlanReferentOrPilote,
  PlanType,
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
  UpdatePlanRequest,
} from '@/domain/plans/plans';
import { AxeType } from '../fiches/shared/models/axe.table';
import { PlanError } from './plans.errors';
import { Result } from './plans.result';

export interface PlansRepositoryInterface {
  create(
    plan: CreatePlanRequest,
    userId: string
  ): Promise<Result<AxeType, PlanError>>;

  update(
    planOrAxeId: number,
    planOrAxe: UpdatePlanRequest,
    userId: string
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
    userId: string
  ): Promise<Result<UpdatePlanReferentsSchema[], PlanError>>;

  getPilotes(
    planId: number
  ): Promise<Result<PlanReferentOrPilote[], PlanError>>;

  setPilotes(
    planId: number,
    pilotes: UpdatePlanPilotesSchema[],
    userId: string
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
