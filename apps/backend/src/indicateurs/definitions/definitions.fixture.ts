import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferRouterInputs } from '@trpc/server';
import { onTestFinished } from 'vitest';

type CreateIndicateurDefinitionInput =
  inferRouterInputs<AppRouter>['indicateurs']['definitions']['create'];

export async function createIndicateurPerso({
  caller,
  indicateurData,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  indicateurData: CreateIndicateurDefinitionInput;
}) {
  const indicateurId = await caller.indicateurs.definitions.create(
    indicateurData
  );

  onTestFinished(async () => {
    await caller.indicateurs.definitions.delete({
      indicateurId,
      collectiviteId: indicateurData.collectiviteId,
    });
  });

  return indicateurId;
}
