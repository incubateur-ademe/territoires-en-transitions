import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferRouterInputs } from '@trpc/server';
import { onTestFinished } from 'vitest';

type CreateFicheInput =
  inferRouterInputs<AppRouter>['plans']['fiches']['create'];

export async function createFiche({
  caller,
  ficheInput,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  ficheInput: CreateFicheInput;
}) {
  const ficheId = await caller.plans.fiches.create(ficheInput);

  onTestFinished(async () => {
    await caller.plans.fiches.delete({
      ficheId,
    });
  });

  return ficheId;
}
