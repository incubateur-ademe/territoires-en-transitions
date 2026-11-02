import { Injectable } from '@nestjs/common';
import { ListPlansService as AppListPlansService } from '@tet/backend/plans/plans/list-plans/list-plans.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Personne } from '@tet/domain/collectivites';
import { z } from 'zod';
import {
  CollectiviteAccessError,
  CollectiviteAccessService,
  SUPER_ADMIN_REQUIRED_MESSAGE,
} from '../shared/collectivite-access.service';
import { ListPlansActivityRepository } from './list-plans-activity.repository';

const MAX_PLANS = 50;

export const listCollectivitePlansInputSchema = z.object({
  collectiviteId: z
    .number()
    .int()
    .positive()
    .describe('Identifiant TeT de la collectivité'),
});
export type ListCollectivitePlansInput = z.infer<
  typeof listCollectivitePlansInputSchema
>;

export const listCollectivitePlansOutputSchema = z.object({
  totalCount: z.number(),
  plans: z.array(
    z.object({
      planId: z.number(),
      nom: z.string().nullable(),
      type: z.string().nullable(),
      status: z.string(),
      totalFiches: z
        .number()
        .describe('Fiches du plan, sous-actions comprises'),
      fichesParStatut: z
        .record(z.string(), z.number())
        .describe('Fiches hors sous-actions et supprimées, par statut'),
      derniereModificationFiche: z.string().nullable(),
      fichesModifiees90Jours: z.number(),
      pilotes: z.array(z.string()),
      referents: z.array(z.string()),
      creeLe: z.string().nullable(),
    })
  ),
});
export type ListCollectivitePlansOutput = z.infer<
  typeof listCollectivitePlansOutputSchema
>;

type ListCollectivitePlansError = CollectiviteAccessError | 'LIST_PLANS_ERROR';

const toNoms = (personnes: Personne[] | undefined) =>
  (personnes ?? [])
    .map((personne) => personne.userName ?? personne.tagName ?? null)
    .filter((nom): nom is string => Boolean(nom));

@Injectable()
export class ListCollectivitePlansService {
  constructor(
    private readonly listPlansService: AppListPlansService,
    private readonly listPlansActivityRepository: ListPlansActivityRepository,
    private readonly collectiviteAccessService: CollectiviteAccessService
  ) {}

  async run(
    input: ListCollectivitePlansInput,
    { user }: { user: AuthenticatedUser }
  ): Promise<Result<ListCollectivitePlansOutput, ListCollectivitePlansError>> {
    const access = await this.collectiviteAccessService.assertAllowed(
      input.collectiviteId,
      { public: 'plans.read', confidentiel: 'plans.read_confidentiel' },
      user
    );
    if (!access.success) {
      return access;
    }

    const plans = await this.listPlansService.listPlans(
      { collectiviteId: input.collectiviteId, limit: MAX_PLANS },
      { user }
    );
    if (!plans.success) {
      return plans.error === 'UNAUTHORIZED'
        ? failure('UNAUTHORIZED', new Error(SUPER_ADMIN_REQUIRED_MESSAGE))
        : failure('LIST_PLANS_ERROR');
    }

    const activity = await this.listPlansActivityRepository.getActivity(
      plans.data.plans.map((plan) => plan.id)
    );

    return success({
      totalCount: plans.data.totalCount,
      plans: plans.data.plans.map((plan) => {
        const planActivity = activity.get(plan.id);
        return {
          planId: plan.id,
          nom: plan.nom ?? null,
          type: plan.type?.type ?? null,
          status: plan.status,
          totalFiches: plan.totalFiches ?? 0,
          fichesParStatut: planActivity?.fichesParStatut ?? {},
          derniereModificationFiche:
            planActivity?.derniereModificationFiche ?? null,
          fichesModifiees90Jours: planActivity?.fichesModifiees90Jours ?? 0,
          pilotes: toNoms(plan.pilotes),
          referents: toNoms(plan.referents),
          creeLe: plan.createdAt ?? null,
        };
      }),
    });
  }
}
