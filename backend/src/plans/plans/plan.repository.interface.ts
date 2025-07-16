import {
  CreatePlanRequest,
  PlanNode,
  PlanReferentOrPilote,
  PlanType,
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
  UpdatePlanRequest,
} from '@/backend/plans/plans/plans.schema';
import { AuthenticatedUser } from '@/backend/users/index-domain';
import { AxeType } from '../fiches/shared/models/axe.table';
import { PlanError } from './plan.errors';
import { Result } from './plan.result';

export interface PlansRepositoryInterface {
  /**
   * Creates a new plan
   */
  create(
    plan: CreatePlanRequest,
    userId: string
  ): Promise<Result<AxeType, PlanError>>;

  /**
   * Updates an existing plan or axe
   */
  update(
    planOrAxeId: number,
    planOrAxe: UpdatePlanRequest,
    userId: string
  ): Promise<Result<AxeType, PlanError>>;

  /**
   * Finds a plan by ID and includes its pilotes
   */
  findById(
    planId: number
  ): Promise<Result<AxeType & { pilotes: PlanReferentOrPilote[] }, PlanError>>;

  /**
   * Gets all plans for a collectivité
   */
  list(collectiviteId: number): Promise<AxeType[]>;

  /**
   * Gets all referents for a plan
   */
  getReferents(
    planId: number
  ): Promise<Result<PlanReferentOrPilote[], PlanError>>;

  /**
   * Sets referents for a plan (replaces existing ones)
   */
  setReferents(
    planId: number,
    referents: UpdatePlanReferentsSchema[]
  ): Promise<Result<UpdatePlanReferentsSchema[], PlanError>>;

  /**
   * Gets all pilotes for a plan
   */
  getPilotes(
    planId: number
  ): Promise<Result<PlanReferentOrPilote[], PlanError>>;

  /**
   * Sets pilotes for a plan (replaces existing ones)
   */
  setPilotes(
    planId: number,
    pilotes: UpdatePlanPilotesSchema[]
  ): Promise<Result<UpdatePlanPilotesSchema[], PlanError>>;

  /**
   * Gets the plan structure with all axes and fiches
   */
  getPlan({
    planId,
    user,
  }: {
    planId: number;
    user: AuthenticatedUser;
  }): Promise<Result<PlanNode[], PlanError>>;

  /**
   * Gets basic plan information including type
   */
  getPlanBasicInfo(
    planId: number
  ): Promise<Result<AxeType & { type: PlanType | null }, PlanError>>;

  /**
   * Deletes an axe and all its child axes
   */
  deleteAxe(axeId: number): Promise<Result<void, PlanError>>;
}
