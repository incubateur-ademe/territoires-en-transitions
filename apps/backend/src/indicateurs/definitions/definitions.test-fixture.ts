import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferRouterInputs } from '@trpc/server';
import { omit, pick } from 'es-toolkit';
import { onTestFinished } from 'vitest';
import { UpdateIndicateurDefinitionInput } from './mutate-definition/mutate-definition.input';

type CreateIndicateurDefinitionInput =
  inferRouterInputs<AppRouter>['indicateurs']['definitions']['create'];

type AllowedInput = Pick<CreateIndicateurDefinitionInput, 'collectiviteId'> &
  Partial<Omit<CreateIndicateurDefinitionInput, 'collectiviteId'>> &
  UpdateIndicateurDefinitionInput['indicateurFields'];

export async function createIndicateurPerso({
  caller,
  indicateurData,
}: {
  caller: ReturnType<TrpcRouter['createCaller']>;
  indicateurData: AllowedInput;
}) {
  const createFields = [
    'collectiviteId',
    'titre',
    'unite',
    'thematiques',
    'commentaire',
    'estFavori',
    'ficheId',
  ] as const;

  const indicateurId = await caller.indicateurs.definitions.create({
    ...pick(indicateurData, createFields),
    titre: indicateurData.titre ?? 'Fixture titre',
  });

  const updateFields = omit(indicateurData, createFields);

  if (Object.keys(updateFields).length > 0) {
    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId: indicateurData.collectiviteId,
      indicateurFields: updateFields,
    });
  }

  onTestFinished(async () => {
    await caller.indicateurs.definitions.delete({
      indicateurId,
      collectiviteId: indicateurData.collectiviteId,
    });
  });

  return indicateurId;
}
