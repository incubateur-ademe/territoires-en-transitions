import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferRouterInputs } from '@trpc/server';
import { onTestFinished } from 'vitest';

type CreateFicheInput =
  inferRouterInputs<AppRouter>['plans']['fiches']['create'] & {
    axeId?: number;
  };

export async function createFiche({
  caller,
  ficheInput,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  ficheInput: CreateFicheInput;
}) {
  const ficheId = await caller.plans.fiches.create(ficheInput);

  if (ficheInput.axeId) {
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        axes: [{ id: ficheInput.axeId }],
      },
    });
  }

  onTestFinished(async () => {
    await caller.plans.fiches.delete({
      ficheId,
    });
  });

  return ficheId;
}

// ----------

type PlanAllowedInput =
  inferRouterInputs<AppRouter>['plans']['plans']['create'];

export async function createPlan({
  caller,
  planData,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  planData: PlanAllowedInput;
}) {
  const plan = await caller.plans.plans.create(planData);

  onTestFinished(async () => {
    await caller.plans.plans.deletePlan({ planId: plan.id });
  });

  return plan;
}

// ----------

type CreateAxeAllowedInput =
  inferRouterInputs<AppRouter>['plans']['plans']['createAxe'];

export async function createAxe({
  caller,
  axeData,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  axeData: CreateAxeAllowedInput;
}) {
  const axe = await caller.plans.plans.createAxe(axeData);

  onTestFinished(async () => {
    await caller.plans.plans.deleteAxe({ axeId: axe.id });
  });

  return axe;
}
