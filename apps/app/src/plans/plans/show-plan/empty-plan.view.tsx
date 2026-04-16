'use client';
import { appLabels } from '@/app/labels/catalog';
import { useCreateFicheResume } from '@/app/plans/fiches/data/use-create-fiche-resume';
import PictoAction from '@/app/ui/pictogrammes/PictoAction';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { PlanNode } from '@tet/domain/plans';
import { EmptyCard } from '@tet/ui';
import { useCreateAxe } from './data/use-create-axe';

export const EmptyPlanView = ({
  currentCollectivite,
  plan,
}: {
  currentCollectivite: CollectiviteCurrent;
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

  if (!currentCollectivite.hasCollectivitePermission('plans.mutate')) {
    return (
      <EmptyCard
        picto={(props) => <PictoAction {...props} />}
        title={appLabels.pasDActionNiArborescencePlanLecture}
      />
    );
  }

  return (
    <EmptyCard
      title={appLabels.pasDActionNiArborescencePlan}
      actions={[
        {
          children: appLabels.ajouterNouveauTitreAxe,
          dataTest: 'AjouterAxe',
          variant: 'outlined',
          onClick: () => addAxe(),
        },
        {
          children: appLabels.creerAction,
          onClick: () => createFicheResume(),
        },
      ]}
    />
  );
};
