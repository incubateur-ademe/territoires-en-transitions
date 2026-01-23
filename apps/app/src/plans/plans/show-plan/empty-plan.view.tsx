'use client';
import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { PlanNode } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { EmptyCard } from '@tet/ui';
import { useCreateAxe } from './data/use-create-axe';

export const EmptyPlanView = ({
  currentCollectivite,
  plan,
}: {
  currentCollectivite: CollectiviteAccess;
  plan: PlanNode;
}) => {
  const { mutate: addAxe } = useCreateAxe({
    collectiviteId: currentCollectivite.collectiviteId,
    parentAxe: plan,
    planId: plan.id,
  });

  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId: currentCollectivite.collectiviteId,
    axeId: plan.id,
    planId: plan.id,
    axeFichesIds: plan.fiches,
  });

  if (!hasPermission(currentCollectivite.permissions, 'plans.mutate')) {
    return (
      <EmptyCard
        picto={(props) => <PictoAction {...props} />}
        title="Cette collectivité n'a pas encore d'action ni d'arborescence de plan"
      />
    );
  }

  return (
    <EmptyCard
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
