import { AppRouter, TrpcRouter } from '@/backend/utils/trpc/trpc.router';
import { inferRouterInputs } from '@trpc/server';
import { omit, pick } from 'es-toolkit';
import { onTestFinished } from 'vitest';
import { UpsertValeurIndicateur } from '../valeurs/upsert-valeur-indicateur.request';
import { UpdateIndicateurDefinitionInput } from './mutate-definition/mutate-definition.input';

type CreateIndicateurDefinitionInput =
  inferRouterInputs<AppRouter>['indicateurs']['definitions']['create'];

type AllowedInput = Pick<CreateIndicateurDefinitionInput, 'collectiviteId'> &
  Partial<Omit<CreateIndicateurDefinitionInput, 'collectiviteId'>> &
  UpdateIndicateurDefinitionInput['indicateurFields'] & {
    valeurs?: Omit<UpsertValeurIndicateur, 'indicateurId' | 'collectiviteId'>[];
  };

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
  console.log(`Created indicateur ${indicateurId}`);

  const updateFields = omit(indicateurData, createFields);

  if (Object.keys(updateFields).length > 0) {
    await caller.indicateurs.definitions.update({
      indicateurId,
      collectiviteId: indicateurData.collectiviteId,
      indicateurFields: updateFields,
    });
  }

  if (indicateurData.valeurs) {
    indicateurData.valeurs
      .map((valeur) => ({
        ...valeur,
        collectiviteId: indicateurData.collectiviteId,
        indicateurId,
      }))
      .forEach(async (valeur) => {
        await caller.indicateurs.valeurs.upsert(valeur);
      });
  }

  onTestFinished(async () => {
    console.log(`Deleting indicateur ${indicateurId}`);
    await caller.indicateurs.definitions.delete({
      indicateurId,
      collectiviteId: indicateurData.collectiviteId,
    });
  });

  return indicateurId;
}
