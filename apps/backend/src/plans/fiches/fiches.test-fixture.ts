import { AppRouter, TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { inferRouterInputs } from '@trpc/server';
import { onTestFinished } from 'vitest';

type CreateFicheInput =
  inferRouterInputs<AppRouter>['plans']['fiches']['create']['fiche'] & {
    axeId?: number;
    pilotes?: { userId: string }[];
    indicateurs?: { id: number }[];
  };

type FicheId = number;

export async function createFicheAndCleanupFunction({
  caller,
  ficheInput,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  ficheInput: CreateFicheInput;
}): Promise<{ ficheId: FicheId; ficheCleanup: () => Promise<void> }> {
  const { axeId, pilotes, indicateurs, ...ficheProps } = ficheInput;
  const fiche = await caller.plans.fiches.create({ fiche: ficheProps });
  const ficheId = fiche.id;

  if (axeId || pilotes?.length || indicateurs?.length) {
    await caller.plans.fiches.update({
      ficheId,
      ficheFields: {
        axes: axeId ? [{ id: axeId }] : undefined,
        pilotes,
        indicateurs,
      },
      isNotificationEnabled: true,
    });
  }

  const ficheCleanup = async () => {
    await caller.plans.fiches.delete({
      ficheId,
      deleteMode: 'hard',
    });
  };

  return { ficheId, ficheCleanup };
}

export async function createFiches({
  caller,
  ficheInputs,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  ficheInputs: CreateFicheInput[];
}): Promise<{ ficheIds: FicheId[]; cleanup: () => Promise<void> }> {
  const fiches = await Promise.all(ficheInputs.map(async (ficheInput) => {
    return await createFicheAndCleanupFunction({ caller, ficheInput });
  }));

  const ficheIds = fiches.map((fiche) => fiche.ficheId);
  const cleanup = async () => {
    await Promise.all(fiches.map(async (fiche) => {
      await fiche.ficheCleanup();
    }));
  };

  return { ficheIds, cleanup };
}

export async function createFiche({
  caller,
  ficheInput,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  ficheInput: CreateFicheInput;
}): Promise<FicheId> {
  const { ficheId, ficheCleanup } = await createFicheAndCleanupFunction({
    caller,
    ficheInput,
  });

  onTestFinished(async () => {
    await ficheCleanup();
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
    await caller.plans.plans.delete({ planId: plan.id });
  });

  return plan;
}

// ----------

type CreateAxeAllowedInput =
  inferRouterInputs<AppRouter>['plans']['axes']['create'];

export async function createAxe({
  caller,
  axeData,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  axeData: CreateAxeAllowedInput;
}) {
  const axe = await caller.plans.axes.create(axeData);

  onTestFinished(async () => {
    await caller.plans.axes.delete({ axeId: axe.id });
  });

  return axe;
}
