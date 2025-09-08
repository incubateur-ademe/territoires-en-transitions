import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DeleteFicheService } from '../fiches/delete-fiche/delete-fiche.service';
import { AxeType } from '../fiches/shared/models/axe.table';
import { PlanError, PlanErrorType } from './plans.errors';
import type { PlansRepositoryInterface } from './plans.repository.interface';
import { Result } from './plans.result';
import {
  CreateAxeRequest,
  CreatePlanRequest,
  ListPlansResponse,
  Plan,
  UpdateAxeRequest,
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
  UpdatePlanRequest,
} from './plans.schema';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    @Inject('PlansRepositoryInterface')
    private readonly plansRepository: PlansRepositoryInterface,
    private readonly permissionService: PermissionService,
    private readonly collectivite: CollectivitesService,
    private readonly deleteFicheService: DeleteFicheService
  ) {}

  async listPlans(
    collectiviteId: number,
    user: AuthenticatedUser,
    options?: {
      limit?: number;
      page?: number;
      sort?: {
        field: 'nom' | 'createdAt' | 'type';
        direction: 'asc' | 'desc';
      };
    }
  ): Promise<Result<ListPlansResponse, PlanError>> {
    this.logger.log(
      `Fetching detailed plans for collectivité ${collectiviteId}${
        options?.limit ? ` with limit ${options.limit}` : ''
      }${options?.page ? ` page ${options.page}` : ''}${
        options?.sort
          ? ` sorted by ${options.sort.field} ${options.sort.direction}`
          : ''
      }`
    );

    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const isAllowed = await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? PermissionOperationEnum['PLANS.LECTURE']
        : PermissionOperationEnum['PLANS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const listResult = await this.plansRepository.list(collectiviteId, options);
    if (!listResult.success) {
      return {
        success: false,
        error: listResult.error,
      };
    }
    const { plans: rootAxes, totalCount } = listResult.data;

    const detailedPlans = await Promise.all(
      rootAxes.map(async (rootAxe: AxeType) => {
        const planId = rootAxe.id;

        const planResult = await this.plansRepository.getPlan({
          planId,
          user,
        });

        if (!planResult.success) {
          this.logger.error(
            `Failed to get plan structure for plan ${planId}: ${planResult.error}`
          );
          return null;
        }

        const referentsResult = await this.plansRepository.getReferents(planId);
        const referents = referentsResult.success ? referentsResult.data : [];

        const pilotesResult = await this.plansRepository.getPilotes(planId);
        const pilotes = pilotesResult.success ? pilotesResult.data : [];

        const planBasicInfoResult = await this.plansRepository.getPlanBasicInfo(
          planId
        );
        const type = planBasicInfoResult.success
          ? planBasicInfoResult.data.type
          : null;

        return {
          id: planId,
          nom: rootAxe.nom,
          axes: planResult.data,
          referents,
          pilotes,
          type,
          collectiviteId: rootAxe.collectiviteId,
          createdAt: rootAxe.createdAt,
        };
      })
    );

    const validPlans = detailedPlans.filter(
      (plan: Plan | null): plan is Plan => plan !== null
    );

    this.logger.log(
      `Successfully fetched ${validPlans.length} detailed plans for collectivité ${collectiviteId} (total: ${totalCount})`
    );

    return {
      success: true,
      data: {
        plans: validPlans,
        totalCount,
      },
    };
  }

  async createPlan(
    plan: CreatePlanRequest,
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<
    Result<
      AxeType & {
        referents: UpdatePlanReferentsSchema[];
        pilotes: UpdatePlanPilotesSchema[];
      },
      PlanError
    >
  > {
    this.logger.log(
      `Creating plan ${plan.nom} for collectivité ${
        plan.collectiviteId
      } (${JSON.stringify(plan)})`
    );

    const isImportAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.FICHES.IMPORT'],
      ResourceType.PLATEFORME,
      null,
      true
    );

    const isEditionAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.EDITION'],
      ResourceType.COLLECTIVITE,
      plan.collectiviteId,
      true
    );

    if (!isEditionAllowed && !isImportAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const createdPlanResult = await this.plansRepository.create(
      plan,
      user.id,
      tx
    );

    if (!createdPlanResult.success) {
      return {
        success: false,
        error: createdPlanResult.error,
      };
    }

    if (plan.referents) {
      this.logger.log(
        `Adding referents to plan ${plan.nom} for collectivité ${plan.collectiviteId} )`
      );
      const setReferentsResult = await this.plansRepository.setReferents(
        createdPlanResult.data.id,
        plan.referents,
        user.id,
        tx
      );
      if (!setReferentsResult.success) {
        this.logger.log(
          `Error adding referents to plan ${plan.nom} for collectivité ${plan.collectiviteId}: ${setReferentsResult.error}`
        );
        return {
          success: false,
          error: setReferentsResult.error,
        };
      }
    }

    if (plan.pilotes) {
      this.logger.log(
        `Adding pilotes to plan ${plan.nom} for collectivité ${plan.collectiviteId} )`
      );
      const setPilotesResult = await this.plansRepository.setPilotes(
        createdPlanResult.data.id,
        plan.pilotes,
        user.id,
        tx
      );
      if (!setPilotesResult.success) {
        this.logger.log(
          `Error adding pilotes to plan ${plan.nom} for collectivité ${plan.collectiviteId}: ${setPilotesResult.error}`
        );
        return {
          success: false,
          error: setPilotesResult.error,
        };
      }
    }

    this.logger.log(
      `Successfully created plan ${createdPlanResult.data.id} for collectivité ${plan.collectiviteId}`
    );

    return {
      success: true,
      data: {
        ...createdPlanResult.data,
        referents: plan.referents ?? [],
        pilotes: plan.pilotes ?? [],
      },
    };
  }

  async updatePlan(
    plan: UpdatePlanRequest,
    user: AuthenticatedUser
  ): Promise<
    Result<
      AxeType & {
        referents: UpdatePlanReferentsSchema[];
        pilotes: UpdatePlanPilotesSchema[];
      },
      PlanError
    >
  > {
    this.logger.log(`Updating plan ${plan.id}`);

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.EDITION'],
      ResourceType.COLLECTIVITE,
      plan.collectiviteId,
      true
    );

    if (!isAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const existingPlanResult = await this.plansRepository.findById(plan.id);
    if (!existingPlanResult.success) {
      return {
        success: false,
        error: existingPlanResult.error,
      };
    }
    const isRootAxe = existingPlanResult.data.parent === null;
    if (!isRootAxe) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const updatedPlanResult = await this.plansRepository.update(
      plan.id,
      plan,
      user.id
    );
    if (!updatedPlanResult.success) {
      return {
        success: false,
        error: updatedPlanResult.error,
      };
    }

    let referents: UpdatePlanReferentsSchema[] = [];
    if (plan.referents !== undefined) {
      // Check referent permissions if referents are being updated
      const referentPermissionAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['PLANS.EDITION'],
        ResourceType.COLLECTIVITE,
        plan.collectiviteId,
        true
      );

      if (!referentPermissionAllowed) {
        return {
          success: false,
          error: PlanErrorType.UNAUTHORIZED,
        };
      }

      const setReferentsResult = await this.plansRepository.setReferents(
        plan.id,
        plan.referents,
        user.id
      );
      if (!setReferentsResult.success) {
        return {
          success: false,
          error: setReferentsResult.error,
        };
      }
      referents = plan.referents;
    } else {
      const getReferentsResult = await this.plansRepository.getReferents(
        plan.id
      );
      if (!getReferentsResult.success) {
        return {
          success: false,
          error: getReferentsResult.error,
        };
      }
      referents = getReferentsResult.data;
    }

    let pilotes: UpdatePlanPilotesSchema[] = [];
    if (plan.pilotes !== undefined) {
      const pilotePermissionAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['PLANS.EDITION'],
        ResourceType.COLLECTIVITE,
        plan.collectiviteId,
        true
      );

      if (!pilotePermissionAllowed) {
        return {
          success: false,
          error: PlanErrorType.UNAUTHORIZED,
        };
      }

      const setPilotesResult = await this.plansRepository.setPilotes(
        plan.id,
        plan.pilotes,
        user.id
      );
      if (!setPilotesResult.success) {
        return {
          success: false,
          error: setPilotesResult.error,
        };
      }
      pilotes = plan.pilotes;
    } else {
      const getPilotesResult = await this.plansRepository.getPilotes(plan.id);
      if (!getPilotesResult.success) {
        return {
          success: false,
          error: getPilotesResult.error,
        };
      }
      pilotes = getPilotesResult.data;
    }

    this.logger.log(`Successfully updated plan ${plan.id}`);
    return {
      success: true,
      data: { ...updatedPlanResult.data, referents, pilotes },
    };
  }

  async findById(
    planId: number,
    user: AuthenticatedUser
  ): Promise<Result<Plan, PlanError>> {
    const planBasicInfoResult = await this.plansRepository.getPlanBasicInfo(
      planId
    );
    if (!planBasicInfoResult.success) {
      return {
        success: false,
        error: planBasicInfoResult.error,
      };
    }

    const collectiviteId = planBasicInfoResult.data.collectiviteId;

    const collectivitePrivate = await this.collectivite.isPrivate(
      collectiviteId
    );

    const isAllowed = await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? PermissionOperationEnum['PLANS.LECTURE']
        : PermissionOperationEnum['PLANS.VISITE'],
      ResourceType.COLLECTIVITE,
      collectiviteId,
      true
    );

    if (!isAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const planResult = await this.plansRepository.getPlan({
      planId,
      user,
    });

    if (!planResult.success) {
      return {
        success: false,
        error: planResult.error,
      };
    }

    const referentsResult = await this.plansRepository.getReferents(planId);
    if (!referentsResult.success) {
      return {
        success: false,
        error: referentsResult.error,
      };
    }

    const planWithPilotesResult = await this.plansRepository.findById(planId);
    if (!planWithPilotesResult.success) {
      return {
        success: false,
        error: planWithPilotesResult.error,
      };
    }

    return {
      success: true,
      data: {
        ...planBasicInfoResult.data,
        axes: planResult.data,
        referents: referentsResult.data,
        pilotes: planWithPilotesResult.data.pilotes,
      },
    };
  }

  async upsertAxe(
    axe: CreateAxeRequest | UpdateAxeRequest,
    user: AuthenticatedUser
  ): Promise<Result<AxeType, PlanError>> {
    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.EDITION'],
      ResourceType.COLLECTIVITE,
      axe.collectiviteId,
      true
    );
    if (!isAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    if ('id' in axe) {
      const updatedAxeResult = await this.plansRepository.update(
        axe.id,
        axe,
        user.id
      );
      if (!updatedAxeResult.success) {
        return {
          success: false,
          error: updatedAxeResult.error,
        };
      }
      return { success: true, data: updatedAxeResult.data };
    } else {
      const createdAxeResult = await this.plansRepository.create(axe, user.id);
      if (!createdAxeResult.success) {
        return {
          success: false,
          error: createdAxeResult.error,
        };
      }
      return { success: true, data: createdAxeResult.data };
    }
  }

  async deleteAxe(
    axeId: number,
    user: AuthenticatedUser
  ): Promise<Result<void, PlanError>> {
    this.logger.log(`Deleting axe ${axeId}`);

    const axeResult = await this.plansRepository.findById(axeId);
    if (!axeResult.success) {
      return {
        success: false,
        error: axeResult.error,
      };
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.EDITION'],
      ResourceType.COLLECTIVITE,
      axeResult.data.collectiviteId,
      true
    );

    if (!isAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const deleteResult = await this.plansRepository.deleteAxeAndChildrenAxes(
      axeId
    );
    if (!deleteResult.success) {
      return {
        success: false,
        error: deleteResult.error,
      };
    }

    const { impactedFicheIds } = deleteResult.data;
    if (impactedFicheIds.length > 0) {
      this.logger.log(`Deleting ${impactedFicheIds.length} orphaned fiches`);
      await Promise.all(
        impactedFicheIds.map((ficheId) =>
          this.deleteFicheService.deleteFiche(ficheId, { user })
        )
      );
    }

    this.logger.log(
      `Successfully deleted axe ${axeId} and ${impactedFicheIds.length} orphaned fiches`
    );
    return { success: true, data: undefined };
  }

  async deletePlan(
    planId: number,
    user: AuthenticatedUser
  ): Promise<Result<void, PlanError>> {
    this.logger.log(`Deleting plan ${planId}`);

    const planResult = await this.plansRepository.findById(planId);

    if (!planResult.success) {
      return {
        success: false,
        error: planResult.error,
      };
    }

    if (planResult.data.parent !== null) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const isAllowed = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['PLANS.EDITION'],
      ResourceType.COLLECTIVITE,
      planResult.data.collectiviteId,
      true
    );

    if (!isAllowed) {
      return {
        success: false,
        error: PlanErrorType.UNAUTHORIZED,
      };
    }

    const deleteResult = await this.plansRepository.deleteAxeAndChildrenAxes(
      planId
    );
    if (deleteResult.success) {
      const { impactedFicheIds } = deleteResult.data;
      if (impactedFicheIds.length > 0) {
        this.logger.log(`Deleting ${impactedFicheIds.length} orphaned fiches`);
        await Promise.all(
          impactedFicheIds.map((ficheId) =>
            this.deleteFicheService.deleteFiche(ficheId, { user })
          )
        );
      }
    }

    if (!deleteResult.success) {
      return {
        success: false,
        error: deleteResult.error,
      };
    }

    this.logger.log(`Successfully deleted plan ${planId}`);
    return { success: true, data: undefined };
  }
}
