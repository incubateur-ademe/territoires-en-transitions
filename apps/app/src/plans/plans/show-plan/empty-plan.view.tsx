'use client';
import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';
import { useUpsertAxe } from './data/use-upsert-axe';

export const EmptyPlanView = ({
  currentCollectivite,
  plan,
}: {
  currentCollectivite: CollectiviteAccess;
  plan: PlanNode;
}) => {
  const { mutate: addAxe } = useUpsertAxe({
    collectiviteId: currentCollectivite.collectiviteId,
    parentAxe: plan,
    planId: plan.id,
    mutationKey: ['create_axe'],
  });

  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId: currentCollectivite.collectiviteId,
    axeId: plan.id,
    planId: plan.id,
    axeFichesIds: plan.fiches,
  });

  return (
    <EmptyCard
      picto={(props) => <PictoAction {...props} />}
      title="Vous n'avez aucune action ni arborescence de plan !"
      actions={[
        {
          children: 'Ajouter un nouveau titre/axe',
          dataTest: 'AjouterAxe',
          variant: 'outlined',
          onClick: () => addAxe(),
        },
        {
          children: 'Créer une action',
          onClick: () => createFicheResume(),
        },
      ]}
    />
  );
};
